class GlBuffer {
    
    constructor ({ gl, type, initialData }) {
        this.gl = gl
        this.vbo = this.gl.createBuffer()
        this.type = type
        if (initialData != null)
            this.loadBufferData(initialData)
    }

    loadBufferData (bufferData) {
        if (bufferData == null) return
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new this.type(bufferData), this.gl.STATIC_DRAW)
    }

    bind () {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
    }


}