"use strict"

// global variables
var canvas;
var gl;
var positions;
var shaderProgram;
var aPosition, uModelViewProjMatrix;
var vboPosition;
var modelViewProjMatrix;
var render;
var pointCount;
var drawingMode;
var POINTS = 0;
var LINES = 1;
var SOLID = 2;
var currentlySelectedButton;


function initRenderingContext() {
	canvas = document.getElementById("canvas");
	// Get a WebGL Context
	gl = canvas.getContext("webgl");
	if (gl) {
		// Set the clear Color
		gl.clearColor(0., 0., 0., 1.);	// black
	}
	return gl;
}

function initScene() {
	pointCount = 0
	positions = [];
	render = false;
	drawingMode = POINTS;
}

function initShaders() {
	// Get Source for vertex & fragment shaders
	var vertexShaderSrc = document.getElementById("shader-vs").text;
	var fragmentShaderSrc = document.getElementById("shader-fs").text;

	// Create GLSL shaders (upload source & compile shaders)
	var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
	var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);

	// Link the two shaders into a shader program
	shaderProgram = createShaderProgram(gl, vertexShader, fragmentShader);

	// Look up into the vertex shader where the CPU's vertex data go
	aPosition = gl.getAttribLocation(shaderProgram, "aPosition");
	uModelViewProjMatrix = gl.getUniformLocation(shaderProgram, "uModelViewProjMatrix");
}

function initBuffers() {
	// Create a GPU's Vertex Buffer Object (VBO) and put clip-space vertex data 
	vboPosition = gl.createBuffer();

	// Bind the VBO to ARRAY_BUFFER
	gl.bindBuffer(gl.ARRAY_BUFFER, vboPosition);

	// Upload CPU's vertex data into the GPU's VBO
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
}

function mouseDownEventListener(event) {
	var x = event.clientX;
	var y = event.clientY;

	var rect = event.target.getBoundingClientRect();
	var xClipp = 2 * (x - rect.left) / canvas.width - 1;
	var yClipp = 2 * (rect.top - y) / canvas.height + 1;

	// Update scene
	if (positions.length < 3 * 3) {
		positions.push(xClipp, yClipp, 0.);
		pointCount += 1
		// Bind the VBO to ARRAY_BUFFER
		gl.bindBuffer(gl.ARRAY_BUFFER, vboPosition);
		// Upload CPU's vertex data into the GPU's VBO
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

		render = true;
		renderScene();
	} else {
		render = false;
	}
}

function initMouseEventHandlers() {
	canvas.addEventListener("mousedown", mouseDownEventListener, false);
}

function renderScene() {
	if (!render) {
		gl.clear(gl.COLOR_BUFFER_BIT);
		return;
	}
	// Model Transformation
	var modelMatrix = mat4.create();	// Mmodel = I

	// View Transformation
	var viewMatrix = mat4.create();		// Mview = I
	var eye = [0., 0., .2];
	var center = [0., 0., 0.];
	var up = [0., 1., 0.];
	mat4.lookAt(viewMatrix, eye, center, up);

	// Proj Transformation
	var projMatrix = mat4.create();		// Mproj = I

	var left = -1.;
	var right = 1.;
	var bottom = -1.;
	var top = 1.;
	var near = 0.1;
	var far = 1000.;
	mat4.ortho(projMatrix, left, right, bottom, top, near, far);

	// Model-View-Projection Matrix
	// Mmodel-view-proj = Mproj * Mview * Mmodel
	modelViewProjMatrix = mat4.create();	// MmodelViewProj = I
	mat4.multiply(modelViewProjMatrix, viewMatrix, modelMatrix);
	mat4.multiply(modelViewProjMatrix, projMatrix, modelViewProjMatrix);

	// Clear the framebuffer (canvas)
	gl.clear(gl.COLOR_BUFFER_BIT);

	// Mapping from clip-space coords to the viewport in pixels
	gl.viewport(0, 0, canvas.width, canvas.height);

	// Tell WebGL which shader program to use (vertex & fragments shaders)
	gl.useProgram(shaderProgram);

	// Load uniform data into the GPU
	gl.uniformMatrix4fv(uModelViewProjMatrix, false, modelViewProjMatrix);

	// Turn on the attribute variable
	gl.enableVertexAttribArray(aPosition);

	// Bind to a VBO
	gl.bindBuffer(gl.ARRAY_BUFFER, vboPosition);

	// Tell the attribute (in) how to get data out of VBO
	var size = 3;			// 3 elements (x, y, z) per iteration
	var type = gl.FLOAT;	// 32 bit floats
	var normalize = false; 	// do not normalize the data
	var stride = 0;			// move forward size*sizeof(type) each iter to get next pos
	var offset = 0;			// start at the beginning of the VBO
	gl.vertexAttribPointer(aPosition, size, type, normalize, stride, offset);

	var primitiveType;

	if (drawingMode == LINES) {
		if (pointCount == 1)
			primitiveType = gl.POINTS;
		else if (pointCount == 2)
			primitiveType = gl.LINES;
		else if (pointCount == 3)
			primitiveType = gl.LINE_LOOP;
	}
	else if (drawingMode == POINTS) {
		primitiveType = gl.POINTS;
	}
	else if (drawingMode == SOLID) {
		if (pointCount == 1)
			primitiveType = gl.POINTS;
		else if (pointCount == 2)
			primitiveType = gl.LINES;
		else if (pointCount == 3)
			primitiveType = gl.TRIANGLES;
	}

	var offset = 0;
	var count = pointCount;
	gl.drawArrays(primitiveType, offset, count);
}

function cleanCanvas() {
	pointCount = 0;
	positions = [];
	render = false;
	renderScene();
}

function setPoints() {
	drawingMode = POINTS;
	if (currentlySelectedButton)
		currentlySelectedButton.classList.remove("disabled");
	currentlySelectedButton = document.getElementById("pointsButton");
	currentlySelectedButton.classList.add("disabled");
}

function setLines() {
	drawingMode = LINES;
	if (currentlySelectedButton)
		currentlySelectedButton.classList.remove("disabled");
	currentlySelectedButton = document.getElementById("linesButton");
	currentlySelectedButton.classList.add("disabled");
}

function setSolid() {
	drawingMode = SOLID;
	if (currentlySelectedButton)
		currentlySelectedButton.classList.remove("disabled");
	currentlySelectedButton = document.getElementById("solidButton");
	currentlySelectedButton.classList.add("disabled");
}

function main() {
	// Initialization code
	gl = initRenderingContext();
	if (!gl) {
		return;
	}
	else {
		initScene();
		initShaders();
		initBuffers();
		initMouseEventHandlers();

		// Rendering code
		renderScene();
	}
}
