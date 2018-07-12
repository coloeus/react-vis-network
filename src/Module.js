import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { reactToSvgImageUrl, RafDebouncer } from './util';

const style = {
  position: 'absolute',
  display: 'none',
  top: 0,
  left: 0
};

export default class VisModule extends PureComponent {
  decoratorRef = React.createRef();
  drawDebouncer = new RafDebouncer();
  hasAfterDrawingListener = false;

  updateNetwork = () => {
    const {
      decorator,
      vis: { network }
    } = this.props;

    if (!this.hasAfterDrawingListener && decorator) {
      this.hasAfterDrawingListener = true;
      network.on('afterDrawing', this.moveDecorator);
    }

    if (this.hasAfterDrawingListener && !decorator) {
      network.off('afterDrawing', this.moveDecorator);
      this.hasAfterDrawingListener = false;
    }

    if (this.hasAfterDrawingListener) {
      this.moveDecorator();
    }
  };

  moveDecorator = () =>
    this.drawDebouncer.requestAnimationFrame(() => {
      const {
        id,
        vis: { network }
      } = this.props;
      const decoratorEl = this.decoratorRef.current;

      if (network && decoratorEl) {
        const { [id]: canvasPosition } = network.getPositions([id]);

        if (canvasPosition) {
          const domPosition = network.canvasToDOM(canvasPosition);
          const { height, width } = decoratorEl.getBoundingClientRect();

          const x = domPosition.x - width / 2;
          const y = domPosition.y - height / 2;

          decoratorEl.style.display = 'block';
          decoratorEl.style.transform = `translateX(${x}px) translateY(${y}px)`;
        }
      }
    });

  updateDecorator() {
    const {
      vis: { network },
      decorator
    } = this.props;

    // Initial load, skip
    if (!network) {
      return;
    }

    if (!this.hasAfterDrawingListener && decorator) {
      this.hasAfterDrawingListener = true;
      network.on('afterDrawing', this.moveDecorator);
    }

    if (this.hasAfterDrawingListener && !decorator) {
      network.off('afterDrawing', this.moveDecorator);
      this.hasAfterDrawingListener = false;
    }

    if (this.hasAfterDrawingListener) {
      this.moveDecorator();
    }
  }

  getModuleOptions() {
    const { component, ...entityOptions } = this.props;
    const options = { ...entityOptions };

    if (component) {
      options.image = reactToSvgImageUrl(component(this.props));
      options.shape = 'image';
    }

    return options;
  }

  componentDidMount() {
    this.updateDecorator();
  }

  componentDidUpdate() {
    this.updateDecorator();
  }

  componentWillUnmount() {
    const {
      vis: { network }
    } = this.props;

    if (this.hasAfterDrawingListener) {
      network.off('afterDrawing', this.moveDecorator);
    }
  }

  render() {
    const {
      decorator,
      vis: { network }
    } = this.props;

    return (
      <>
        {network &&
          decorator && (
            <div style={style} ref={this.decoratorRef}>
              {decorator(this.props)}
            </div>
          )}
      </>
    );
  }

  static propTypes = {
    id: PropTypes.string.isRequired,
    component: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
    decorator: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
    vis: PropTypes.shape({
      nodes: PropTypes.object.isRequired,
      edges: PropTypes.object.isRequired,
      network: PropTypes.object
    })
  };
}