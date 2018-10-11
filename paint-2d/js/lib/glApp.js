class GlApp {

  constructor ({ canvas, clearColor, animate, data }) {
    this.data = Object.assign({}, data)
    this.animate = animate
    this.components = []
    // Get a WebGL Context.
    this.canvas = document.getElementById(canvas)
    this.gl = this.canvas.getContext("webgl")
    // Handle error by not performing any more tasks.
    if (!this.gl) return console.log("Error getting webgl")
    // Set the clear color
    this.gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3])
  }

  pauseAnimation () {
    this.animate = false
  }

  resumeAnimation () {
    this.animate = true
    this.run()
  }

  addComponent (component) {
    this.components.push(component);
  }

  addComponents (components) {
    this.components = this.components.concat(components)
  }

  run () {
    var self = this;
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    // Mapping from clip-space coords to the viewport in pixels
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    // Tell each component to render itthis
    for (var component of this.components) {
      component.update()
      component.render()
    }
    // Animate if needed
    if (this.animate) {
      requestAnimationFrame(function () { self.run(); })
    }
  }
}