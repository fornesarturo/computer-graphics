"use strict"

// global variables
var gl;
var canvas;
var scene;

var dragMode;
var dragging;	// Dragging or not

var xLast;		// last position of the mouse
var yLast;

class Scene
{
	constructor()
	{
		this.listModels = [];
	}

	init()
	{
		// Set the clear Color
		gl.clearColor(0., 0., 0., 1.);	// black
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);
		// Camera initialization
		dragging = false;
		this.camera.home();
	}

	addModel(model) 
	{
		this.listModels.push(model);
	}

	addCamera(camera) 
	{
		this.camera = camera;
	}

	update()
	{
		this.camera.update();
	}

	render()
	{
		// Clear the framebuffer (canvas)
		gl.clear(gl.COLOR_BUFFER_BIT);
		// Mapping from clip-space coord to the viewport in pixels
		gl.viewport(0, 0, canvas.width, canvas.height);

		for(var i = 0; i < this.listModels.length; i++)
		{
			this.listModels[i].loadUniformDataIntoGPU(this.camera);
			this.listModels[i].draw();
		}
	}
}

class Shader
{
	constructor(model)
	{
		this.model = model;
	}

	create(vertexShaderID, fragmentShaderID)
	{
		// Get Source for the vertex & fragment shaders
		let vertexShaderSrc = document.getElementById(vertexShaderID).text;
		let fragmentShaderSrc = document.getElementById(fragmentShaderID).text;
		
		// Create GLSL shaders (upload source & compile shaders)
		let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
		let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);

		// Link the two shaders into a shader program
		return createShaderProgram(gl, vertexShader, fragmentShader);
	}

	setSingleColorShader()
	{
		this.shaderProgram = this.create("single-color-shader-vs", "single-color-shader-fs");

		// Look up into the vertex shader where the CPU's vertex data go
		this.aPosition = gl.getAttribLocation(this.shaderProgram, "aPosition");	
		this.uColor = gl.getUniformLocation(this.shaderProgram, "uColor");	
		this.uModelViewProjMatrix = gl.getUniformLocation(this.shaderProgram, "uModelViewProjMatrix");
	
		// Turn on the attribute variable
		gl.enableVertexAttribArray(this.aPosition);
					
		// Bind to a VBO
		gl.bindBuffer(gl.ARRAY_BUFFER, this.model.buffer.vbo);
					
		// Tell the attribute (in) how to get data out of VBO
		var size = 3;			// 3 elements (x, y, z) per iteration
		var type = gl.FLOAT;	// 32 bit floats
		var normalize = false; 	// do not normalize the data
		var stride = 0;	// move forward size*sizeof(type) each iter to get next pos
		var offset = 0;			// start at the beginning of the VBO
		gl.vertexAttribPointer(this.aPosition, size, type, normalize, stride, offset);
	}

	setPerVertexColorShader()
	{
		this.shaderProgram = this.create("per-vertex-color-shader-vs", "per-vertex-color-shader-fs");

		// Look up into the vertex shader where the CPU's vertex data go
		this.aPosition = gl.getAttribLocation(this.shaderProgram, "aPosition");
		this.aColor = gl.getAttribLocation(this.shaderProgram, "aColor");	
		this.uModelViewProjMatrix = gl.getUniformLocation(this.shaderProgram, "uModelViewProjMatrix");
	
		// Turn on the attribute variable
		gl.enableVertexAttribArray(this.aPosition);
					
		// Bind to a VBO
		gl.bindBuffer(gl.ARRAY_BUFFER, this.model.buffer.vbo);
					
		// Tell the attribute (in) how to get data out of VBO
		var size = 3;			// 3 elements (x, y, z) per iteration
		var type = gl.FLOAT;	// 32 bit floats
		var normalize = false; 	// do not normalize the data
		var stride = (3 + 4) * 4;	// move forward size*sizeof(type) each iter to get next pos
		var offset = 0;			// start at the beginning of the VBO
		gl.vertexAttribPointer(this.aPosition, size, type, normalize, stride, offset);

		// Turn on the attribute variable
		gl.enableVertexAttribArray(this.aColor);
					
		// Bind to a VBO
		gl.bindBuffer(gl.ARRAY_BUFFER, this.model.buffer.vbo);
					
		// Tell the attribute (in) how to get data out of VBO
		var size = 4;			// 4 elements (r, g, b, a) per iteration
		var type = gl.FLOAT;	// 32 bit floats
		var normalize = false; 	// do not normalize the data
		var stride = (3 + 4) * 4;	// move forward size*sizeof(type) each iter to get next pos
		var offset = 3 * 4;			// start at the beginning of the VBO
		gl.vertexAttribPointer(this.aColor, size, type, normalize, stride, offset);
	}

	setPointShader()
	{
		this.shaderProgram = this.create("point-shader-vs", "point-shader-fs");

		// Look up into the vertex shader where the CPU's vertex data go
		this.aPosition = gl.getAttribLocation(this.shaderProgram, "aPosition");	
		this.uPointSize = gl.getUniformLocation(this.shaderProgram, "uPointSize");
		this.uColor = gl.getUniformLocation(this.shaderProgram, "uColor");	
		this.uModelViewProjMatrix = gl.getUniformLocation(this.shaderProgram, "uModelViewProjMatrix");
	
		// Turn on the attribute variable
		gl.enableVertexAttribArray(this.aPosition);
					
		// Bind to a VBO
		gl.bindBuffer(gl.ARRAY_BUFFER, this.model.buffer.vbo);
					
		// Tell the attribute (in) how to get data out of VBO
		var size = 3;			// 3 elements (x, y, z) per iteration
		var type = gl.FLOAT;	// 32 bit floats
		var normalize = false; 	// do not normalize the data
		var stride = 0;	// move forward size*sizeof(type) each iter to get next pos
		var offset = 0;			// start at the beginning of the VBO
		gl.vertexAttribPointer(this.aPosition, size, type, normalize, stride, offset);
	}
}

class Buffer
{
	constructor(model)
	{
		this.model = model;
		// Create a GPU's Vertex Buffer Object (VBO) and put clip-space vertex data 
		this.vbo = gl.createBuffer();
		this.ibo = gl.createBuffer();
	}

	loadVertices()
	{
		// Bind the VBO to ARRAY_BUFFER
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

		// Upload CPU's vertex data into the GPU's VBO
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.model.vertices), gl.STATIC_DRAW);
	}

	loadIndices()
	{
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(this.model.indices), gl.STATIC_DRAW);
	}

	loadVerticesAndIndices()
	{
		this.loadVertices();
		this.loadIndices();
	}
}

class Model
{
	constructor()
	{ 
		this.buffer = new Buffer(this);
		this.shader = new Shader(this);
		this.modelMatrix = mat4.create();
		this.color = [1., 1., 1., 1.];
		this.pointSize = 3.;
		this.drawingMode = "solid-single-color";
	}

	setDrawingMode(mode = "solid-single-color")
	{
		this.drawingMode = mode;
		if(mode == "solid-single-color" || mode == "wireframe")
		{
			this.setSingleColorShader();
		}
		else if(mode == "solid-per-vertex-color")
		{
			this.setPerVertexColorShader();
		}
		else if(mode == "points")
		{
			this.setPointShader();
		}
	}

	translate(tx, ty, tz)
	{
		mat4.translate(this.modelMatrix, this.modelMatrix, [tx, ty, tz]);
	}

	setColor(r = 1., g = 1., b = 1., a = 1.)
	{
		this.color = [r, g, b, a];
	}

	setSingleColorShader()
	{
		this.vertices = this.positions;
		this.buffer.loadVerticesAndIndices();
		this.shader.setSingleColorShader();
	}

	setPerVertexColorShader()
	{
		let n = this.positions.length / 3;
		this.vertices = [];
		for(let i = 0; i < n; i++)
		{
			this.vertices.push(this.positions[i*3]);
			this.vertices.push(this.positions[i*3+1]);
			this.vertices.push(this.positions[i*3+2]);
			this.vertices.push(this.colors[i*4]);
			this.vertices.push(this.colors[i*4+1]);
			this.vertices.push(this.colors[i*4+2]);
			this.vertices.push(this.colors[i*4+3]);
		}
		this.buffer.loadVerticesAndIndices();
		this.shader.setPerVertexColorShader();
	}

	setPointShader()
	{
		this.vertices = this.positions;
		this.buffer.loadVerticesAndIndices();
		this.shader.setPointShader();
	}

	loadUniformDataIntoGPU(camera)
	{
		// Model-View-Projection Matrix
		// Mmodel-view-proj = Mproj * Mview * Mmodel
		let modelViewProjMatrix = mat4.create();	// MmodelViewProj = I
		mat4.multiply(modelViewProjMatrix, camera.viewMatrix,this.modelMatrix);
		mat4.multiply(modelViewProjMatrix, camera.projMatrix, modelViewProjMatrix);

		gl.useProgram(this.shader.shaderProgram);
		// Cargar la Matriz de Modelo-Vista y Proyección en el shader
		gl.uniformMatrix4fv(this.shader.uModelViewProjMatrix, false, modelViewProjMatrix);
		if(this.drawingMode == "solid-single-color")
		{
			gl.uniform4fv(this.shader.uColor, this.color);
		}
		else if(this.drawingMode == "points")
		{
			gl.uniform4fv(this.shader.uColor, this.color);
			gl.uniform1f(this.shader.uPointSize, this.pointSize);
		}
	}
}

class Triangle extends Model
{
	constructor()
	{
		super();
		//Default
		this.positions = [0., 0.57735, 0., 	 // V0
					    -0.5, -0.28867, 0., // v1
						 0.5, -0.28867, 0. // V2
						 ];

		this.indices = [0, 1, 2];

		this.colors = [1., 0., 0., 1., 	 // V0: r,g,b,a
					   0., 1., 0., 1., // v1
					   0., 0., 1., 1. // V2
					  ];

		this.setSingleColorShader();	// default shader
	}

	draw()
	{
		// Draw the scene
		let primitiveType = gl.TRIANGLES;
		if(this.drawingMode == "points")
		{
			primitiveType = gl.POINTS;
		}
		else if(this.drawingMode == "wireframe")
		{
			primitiveType = gl.LINE_LOOP;
		}	
		var offset = 0;
		var count = this.indices.length;
		gl.drawElements(primitiveType, count, gl.UNSIGNED_SHORT, offset);
	}
}

class Square extends Model {
	constructor() {
		super();
		//Default
		this.positions = [
			-0.5, 0.5, 0., 	 // V0
			-0.5, -0.5, 0., // v1
			0.5, -0.5, 0., // V2
			0.5, 0.5, 0.
		];

		// this.indices = [
		// 	0, 1, 2,
		// 	2, 3, 0
		// ];

		this.indices = [
			0, 1, 2, 3
		]

		this.colors = [1., 0., 0., 1., 	 // V0: r,g,b,a
			0., 1., 0., 1., // v1
			0., 0., 1., 1. // V2
		];

		this.setSingleColorShader();	// default shader
	}

	draw() {
		// Draw the scene
		let primitiveType = gl.TRIANGLES;
		if (this.drawingMode == "points") {
			primitiveType = gl.POINTS;
		}
		else if (this.drawingMode == "wireframe") {
			primitiveType = gl.LINE_LOOP;
		}
		var offset = 0;
		var count = this.indices.length;
		gl.drawElements(primitiveType, count, gl.UNSIGNED_SHORT, offset);
	}
}

class Cube extends Model {
	constructor() {
		super();
		//Default
		this.positions = [
			1, 1, 1,
			-1, 1, 1,
			-1, -1, 1,
			1, -1, 1,
			1, -1, -1,
			1, 1, -1,
			-1, 1, -1,
			-1, -1, -1
		];

		// Solid indices
		this.indices = [
			0, 1, 2, 
			0, 2, 3,
			4, 7, 5,
			7, 6, 5,
			7, 2, 1,
			7, 1, 6,
			6, 0, 5,
			6, 1, 0,
			5, 0, 4,
			0, 3, 4,
			3, 2, 7,
			4, 3, 7
		];


		// this.indices = [
		// 	0, 1, 2, 3, 0,
		// 	5, 4, 3, 0,
		// 	1, 6, 5,
		// 	4, 7, 6,
		// 	7, 2, 1
		// ];

		

		this.colors = [
			1., 1., 1., 1., 	 // V0: r,g,b,a
			1., 0., 0., 1., // v1
			0., 1., 0., 1., // V2
			0., 0., 1., 1., // V2
			0., 1., 1., 1., // V2
			1., 0., 1., 1., // V2
			0., 1., 0., 1., // V2
			1., 1., 0., 1. // V2
		];

		this.setSingleColorShader();	// default shader
	}

	draw() {
		// Draw the scene
		let primitiveType = gl.TRIANGLES;
		if (this.drawingMode == "points") {
			primitiveType = gl.POINTS;
		}
		else if (this.drawingMode == "wireframe") {
			primitiveType = gl.LINE_LOOP;
		}
		var offset = 0;
		var count = this.indices.length;
		gl.drawElements(primitiveType, count, gl.UNSIGNED_SHORT, offset);
	}
}

class Camera
{
	constructor()
	{
		this.setPerspective(); 
	}

	home()
	{
		this.eye = [0., 0., 5.];
		this.center = [0., 0., 0.];
		this.up = [0., 1., 0.];
		this.rotX = 0.;
		this.rotY = 0.;
		this.lookAt(this.eye, this.center, this.up);
		xLast = 0;
		yLast = 0;
	}

	above()
	{
		this.eye = [0., 5., 0.];
		this.center = [0., 0., 0.];
		this.up = [0, 1, 0];
		this.rotX = 0;
		this.rotY = 0;
		this.lookAt(this.eye, this.center, this.up);
		xLast = 0;
		yLast = 0;
	}

	lookAt(eye, center, up)
	{
		// View Transformation
		this.viewMatrix = mat4.create();		// Mview = I
		this.eye = eye;
		this.center = center;
		this.up = up;
		mat4.lookAt(this.viewMatrix, this.eye, this.center, this.up);
	}

	rotate(angle, rotAxis)
	{
		mat4.rotate(this.viewMatrix, this.viewMatrix, angle, rotAxis);
	}

	update()
	{
		this.lookAt(this.eye, this.center, this.up);
		// this.rotate(this.rotX, [1., 0., 0.]);
		// this.rotate(this.rotY, [0., 1., 0.]);
	}

	setPerspective()
	{
		// Proj Transformation
		this.projMatrix = mat4.create();		// Mproj = I
		this.fovy = 60.;	// degrees
		this.fovy = this.fovy * Math.PI / 180.;
		this.aspect = canvas.width / canvas.height;
		this.near = 0.1;
		this.far = 1000.;
		mat4.perspective(this.projMatrix, this.fovy, this.aspect, this.near, this.far);
	}
}

function mouseDownEventListener(event)
{
	dragging = true;
	var x = event.clientX;
	var y = event.clientY;
	var rect = event.target.getBoundingClientRect();
	x = x - rect.left;
	y = y - rect.top;
	xLast = x;
	yLast = y;
}

function mouseUpEventListener(event)
{
	dragging = false;	// mouse is released
}

function mouseMoveEventListener(event)
{
	var x = event.clientX;
	var y = event.clientY;
	var rect = event.target.getBoundingClientRect();
	var maxX = rect.right;
	var maxY = rect.bottom;
	x = x - rect.left;
	y = y - rect.top;
	var factor = 10. / canvas.height; // The rotation ratio
	// Limit x-axis rotation angle to [-90, 90] degrees
	scene.camera.center = [-(maxX/2 - x) * factor, (maxY/2 - y) * factor, 0.];
	scene.update();
	scene.render();
}

function buttonClickEventListener(event)
{
	if(event.target.id == "btn-home")
	{
		scene.camera.home();
		scene.update();
		scene.render();
	} else if (event.target.id == "btn-above")
	{
		scene.camera.above();
		scene.update();
		scene.render();
	}
}

function initEventHandlers()
{
	canvas.addEventListener("mousedown", mouseDownEventListener, false);
	canvas.addEventListener("mouseup", mouseUpEventListener, false);
	canvas.addEventListener("mousemove", mouseMoveEventListener, false);
	// document.getElementById("btn-home").addEventListener("click", buttonClickEventListener, false);
	// document.getElementById("btn-above").addEventListener("click", buttonClickEventListener, false);
	// document.getElementById("btn-back").addEventListener("click", buttonClickEventListener, false);
}

function main()
{
	canvas = document.getElementById("canvas");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	gl = canvas.getContext("webgl");	// Get a WebGL Context
	if(!gl)
	{
		return;
	}
	scene = new Scene();
	// let triangle1 = new Triangle();
	// triangle1.setColor(1., 0., 0., 1.);
	
	// let triangle2 = new Triangle();
	// triangle2.translate(0.5, 0., -1.);
	// triangle2.setColor(0., 1., 0., 1.);
	
	// let square1 = new Square();
	// square1.setDrawingMode("wireframe");

	// scene.addModel(triangle1);
	// scene.addModel(triangle2);
	
	// scene.addModel(square1);

	let cube = new Cube();
	cube.setDrawingMode("solid-per-vertex-color");
	// cube.setDrawingMode("wireframe");

	let cube2 = new Cube();
	cube2.setDrawingMode("solid-per-vertex-color");

	scene.addModel(cube);
	scene.addModel(cube2);

	cube.translate(0,0,1);
	cube2.translate(-10, 0, 0);
	let camera1 = new Camera();
	scene.addCamera(camera1);
	
	scene.init();
	initEventHandlers();
	scene.render();
}
