"use strict"

// global variables
var canvas;
var gl;
var positionsRojo, positionsMulti;
var colors;
var color;
var singleColorShaderProgram, multipleColorShaderProgram;
var aPositionS, aPositionM, aColor, uColor;
var vboPositionS, vboPositionM, vboColors;

function initRenderingContext()
{
	canvas = document.getElementById("canvas");
	// Get a WebGL Context
	gl = canvas.getContext("webgl");
	if(gl)
	{
		// Set the clear Color
		gl.clearColor(0., 0., 0., 1.);	// black
	}
		return gl;
}

function initScene()
{
	positionsRojo = [
		-0.5, 0.5,
		-0.5, -0.5,
		0.5, -0.5
	];

	positionsMulti = [
		-0.5, 0.5,
		0.5, -0.5,
		0.5, 0.5
	];

	colors = [
		1., 0., 0., 1.,
		0., 1., 0., 1.,
		0., 0., 1., 1.
	];

	color = [1., 0., 0., 1.];
}

function initShaders()
{
	// Get Source for vertex & fragment shaders
	var singleShaderSrc = document.getElementById("shaderSingleColor-vs").text;
	var multipleShaderSrc = document.getElementById("shaderMultiColor-vs").text;
	var fragmentShaderSrc = document.getElementById("shader-fs").text;

	// Create GLSL shaders (upload source & compile shaders)
	var singleShader = createShader(gl, gl.VERTEX_SHADER, singleShaderSrc);
	var multipleShader = createShader(gl,gl.VERTEX_SHADER, multipleShaderSrc);
	var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);

	// Link the two shaders into a shader program
	singleColorShaderProgram = createShaderProgram(gl, singleShader, fragmentShader);
	multipleColorShaderProgram = createShaderProgram(gl, multipleShader, fragmentShader);

	// Look up into the vertex shader where the CPU's vertex data go
	aPositionS = gl.getAttribLocation(singleColorShaderProgram, "aPosition");
	aPositionM = gl.getAttribLocation(multipleColorShaderProgram, "aPosition");
	aColor = gl.getAttribLocation(multipleColorShaderProgram, "aColor");
	uColor = gl.getUniformLocation(singleColorShaderProgram, "uColor");
}

function initBuffers()
{
	// Create a GPU's Vertex Buffer Object (VBO) and put clip-space vertex data 
	vboPositionS = gl.createBuffer();

	// Bind the VBO to ARRAY_BUFFER
	gl.bindBuffer(gl.ARRAY_BUFFER, vboPositionS);

	// Upload CPU's vertex data into the GPU's VBO
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionsRojo), gl.STATIC_DRAW);

	// Create a GPU's Vertex Buffer Object (VBO) and put clip-space vertex data 
	vboPositionM = gl.createBuffer();

	// Bind the VBO to ARRAY_BUFFER
	gl.bindBuffer(gl.ARRAY_BUFFER, vboPositionM);

	// Upload CPU's vertex data into the GPU's VBO
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionsMulti), gl.STATIC_DRAW);

	// Create a GPU's Vertex Buffer Object (VBO) and put clip-space vertex data 
	vboColors = gl.createBuffer();

	// Bind the VBO to ARRAY_BUFFER
	gl.bindBuffer(gl.ARRAY_BUFFER, vboColors);

	// Upload CPU's vertex data into the GPU's VBO
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
}

function renderScene()
{
	// Clear the framebuffer (canvas)
	gl.clear(gl.COLOR_BUFFER_BIT);
				
	// Mapping from clip-space coords to the viewport in pixels
	gl.viewport(0, 0, canvas.width, canvas.height);
				
	// Tell WebGL which shader program to use (vertex & fragments shaders)
	gl.useProgram(singleColorShaderProgram);
				
	// Turn on the attribute variable
	gl.enableVertexAttribArray(aPositionS);

	gl.uniform4fv(uColor, color);
	
	// Bind to a VBO
	gl.bindBuffer(gl.ARRAY_BUFFER, vboPositionS);
				
	// Tell the attribute (in) how to get data out of VBO
	var size = 2;			// 2 elements (x, y) per iteration
	var type = gl.FLOAT;	// 32 bit floats
	var normalize = false; 	// do not normalize the data
	var stride = 0;			// move forward size*sizeof(type) each iter to get next pos
	var offset = 0;			// start at the beginning of the VBO
	gl.vertexAttribPointer(aPositionS, size, type, normalize, stride, offset);
				
	// Draw the scene
	var primitiveType = gl.TRIANGLES;
	var offset = 0;
	var count = 3;	
	gl.drawArrays(primitiveType, offset, count);

	// Multiple Color

	gl.useProgram(multipleColorShaderProgram);
	gl.enableVertexAttribArray(aPositionM);

	gl.bindBuffer(gl.ARRAY_BUFFER, vboPositionM);

	size = 2;
	type = gl.FLOAT;
	normalize = false;
	stride = 0;
	offset = 0;
	gl.vertexAttribPointer(aPositionM, size, type, normalize, stride, offset);

	gl.enableVertexAttribArray(aColor);
	gl.bindBuffer(gl.ARRAY_BUFFER, vboColors);

	size = 4;
	type = gl.FLOAT;
	normalize = false;
	stride = 0;
	offset = 0;
	gl.vertexAttribPointer(aColor, size, type, normalize, stride, offset);

	primitiveType = gl.TRIANGLES;
	offset = 0;
	count = 3;
	gl.drawArrays(primitiveType, offset, count);

}

function main()
{
	// Initialization code
	gl = initRenderingContext();
	if(!gl)
	{
		return;
	}
	else
	{
		initScene();
		initShaders();
		initBuffers();

		// Rendering code
		renderScene();
	}
}
