/*
  Creates a WebGL object that both internally handles verbose operations
  and exposes the glComponent API to extension.

  Receives:
    {
      gl: gl,
      shaders: {
        shaderA: new glShader()
        ...
      },
      buffers: {
        bufferA: new GlBuffer(),
        ...
      }
    }
*/
class GlComponent {

  constructor ({ gl, shaders, buffers, data }) {
    this.gl = gl
    this.render = null
    this.update = null
    this.currentProgram = ""
    this.render = function () {}
    this.update = function () {}
    this.shaders = shaders
    this.data = data
    this.buffers = buffers
  }

  loadBufferData (bufferName, bufferData) {
    this.buffers[bufferName].loadBufferData(bufferData);
  }

  // Receives shader name as a string as it was passed in the
  // shaders object.
  useProgram (shaderName) {
    this.shaders[shaderName].use()
    this.currentProgram = shaderName
  }

  // This function does the whole binding of our VBO to the ARRAY_BUFFER
  // and passing data to it.
  // Receives attribute and buffer as string.
  setupAttribute (attribute, buffer, size, type, normalize, stride, offset) {
    // Turn on the attribute variable
    this.shaders[this.currentProgram].enableVertexAttribArray(attribute);

    // Bind to a VBO
    this.buffers[buffer].bind();

    this.shaders[this.currentProgram].vertexAttribPointer(attribute, size, type, normalize, stride, offset);
  }

  // Draw the scene
  drawArrays (primitiveType, offset, count) {
    this.gl.drawArrays(primitiveType, offset, count);
  }

  // Because uniforms aren't binded in a generic way as
  // attributes, this function returns the uniform's
  // location for the user to operate on it.
  getUniform (uniform) {
    return this.shaders[this.currentProgram].uniformLocations[uniform]
  }

  // Get self object to allow user to write 
  // functions like render and update
  getSelf () {
    return this
  }

  getGL () {
    return this.gl
  }

  // Set the render function in 
  setRender (render) {
    this.render = render
  }

  setUpdate (update) {
    this.update = update
  }
}