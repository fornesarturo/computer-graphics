// {
//     vertexShader: vs, // pass as a string, e.g. document.getElementById("shader-vs").text
//     fragmentShader: fs, // pass as a string, e.g. document.getElementById("shader-fs").text;
//     attributes: ["attribA", "attribB"],
//     uniforms: ["uniformA", "uniformB"]
// }
class GlShader {

    constructor ({ gl, vertexShader, fragmentShader, attributes, uniforms }) {
        this.gl = gl
        // Create GLSL shaders (upload source & compile shaders)
        var t_vertexShader = createShader(this.gl, this.gl.VERTEX_SHADER, vertexShader)
        var t_fragmentShader = createShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShader)
        // Link the two shaders into a shader program
        // Store program in shader object
        this.shaderProgram = createShaderProgram(this.gl, t_vertexShader, t_fragmentShader)

        this.attributeLocations = {}
        this.uniformLocations = {}
        // Look up into the vertex shader where the CPU's vertex data go
        // For each attribute
        for (var attribute of attributes) {
            this.attributeLocations[attribute] = this.gl.getAttribLocation(this.shaderProgram, attribute)
        }
        // For each uniform
        for (var uniform of uniforms) {
            this.uniformLocations[uniform] = this.gl.getUniformLocation(this.shaderProgram, uniform)
        }
    }

    enableVertexAttribArray (attribute) {
        this.gl.enableVertexAttribArray(this.attributeLocations[attribute]);
    }

    vertexAttribPointer (attribute, size, type, normalize, stride, offset) {
        this.gl.vertexAttribPointer(this.attributeLocations[attribute], size, type, normalize, stride, offset);
    }

    use () {
        this.gl.useProgram(this.shaderProgram)
    }
}

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    else {
        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }
}

function createShaderProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    else {
        console.log(gl.getShaderInfoLog(program));
        gl.deleteShader(program);
    }
}