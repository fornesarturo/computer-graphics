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

	setTextureShader()
	{
		this.shaderProgram = this.create("texture-shader-vs", "texture-shader-fs");

		// Look up into the vertex shader where the CPU's vertex data go
		this.aPosition = gl.getAttribLocation(this.shaderProgram, "aPosition");
		this.aTexture = gl.getAttribLocation(this.shaderProgram, "aTexture");
		this.uSampler = gl.getUniformLocation(this.shaderProgram, "uSampler");
		this.uModelViewProjMatrix = gl.getUniformLocation(this.shaderProgram, "uModelViewProjMatrix");
	
		// Turn on the attribute variable
		gl.enableVertexAttribArray(this.aPosition);
					
		// Bind to a VBO
		gl.bindBuffer(gl.ARRAY_BUFFER, this.model.buffer.vbo);
					
		// Tell the attribute (in) how to get data out of VBO
		var size = 3;			// 3 elements (x, y, z) per iteration
		var type = gl.FLOAT;	// 32 bit floats
		var normalize = false; 	// do not normalize the data
		var stride = (3 + 2) * 4;	// move forward size*sizeof(type) each iter to get next pos
		var offset = 0;			// start at the beginning of the VBO
		gl.vertexAttribPointer(this.aPosition, size, type, normalize, stride, offset);

		// Turn on the attribute variable
		gl.enableVertexAttribArray(this.aTexture);
					
		// Bind to a VBO
		gl.bindBuffer(gl.ARRAY_BUFFER, this.model.buffer.vbo);
					
		// Tell the attribute (in) how to get data out of VBO
		var size = 2;			// 2 elements (s, t) per iteration
		var type = gl.FLOAT;	// 32 bit floats
		var normalize = false; 	// do not normalize the data
		var stride = (3 + 2) * 4;	// move forward size*sizeof(type) each iter to get next pos
		var offset = 3 * 4;			// start at the beginning of the VBO
		gl.vertexAttribPointer(this.aTexture, size, type, normalize, stride, offset);
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

	loadFaces()
	{
		// Bind the VBO to ARRAY_BUFFER
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

		// Upload CPU's vertex data into the GPU's VBO
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.model.vertices), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(this.model.indices), gl.STATIC_DRAW);

	}
}

function setupTexture(texture, image)
{
	// Texture
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);	// Flip the image's Y-axis
	// Enable texture unit0
	gl.activeTexture(gl.TEXTURE0);
	// Bind the texture object to the target
	gl.bindTexture(gl.TEXTURE_2D, texture);
	// Set the texture parameters
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	// Set the texture image
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
	scene.render();
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

	setDrawingMode(mode = "solid-single-color", imgFile = "sky.jpg")
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
		else if(mode == "texture")
		{
			this.setTextureShader(imgFile);
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
		this.buffer.loadFaces();
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
		this.buffer.loadFaces();
		this.shader.setPerVertexColorShader();
	}

	setPointShader()
	{
		this.vertices = this.positions;
		this.buffer.loadFaces();
		this.shader.setPointShader();
	}

	setTextureShader(imgFile)
	{
		let n = this.positions.length / 3;
		this.vertices = [];
		for(let i = 0; i < n; i++)
		{
			this.vertices.push(this.positions[i*3]);
			this.vertices.push(this.positions[i*3+1]);
			this.vertices.push(this.positions[i*3+2]);
			this.vertices.push(this.texture[i*2]);
			this.vertices.push(this.texture[i*2+1]);
		}
		this.buffer.loadFaces();
		this.shader.setTextureShader();

		// Create the texture object
		this.textureObj = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.textureObj);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
		if(!this.texture)
		{
			console.log("Failed to create the texture object");
			return false;
		}
		// Create the Image object
		this.image = new Image();
		if(!this.image)
		{
			console.log("Filed to create the image object");
			return false;
		}
		// Register the event handler to be called on loading an image
		var texture = this.textureObj;
		var image = this.image;
		this.image.onload = function() {setupTexture(texture, image);};

		// Tell the browser to load an image (asyncronousley)
		this.image.src = "img/" + imgFile;	// imgFile
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
		else if(this.drawingMode == "texture")
		{
			gl.uniform1i(this.shader.uSampler, 0);
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

		this.texture = [0.5, 1.,
						0., 0.,
						1., 0.
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
		var count = this.indices.length;
		gl.drawElements(primitiveType, count, gl.UNSIGNED_SHORT, 0);
	}
}

class Cube extends Model
{
	constructor()
	{
		super();
		//Default
		this.positions = [1., 1., 1., // V0
					     -1., 1., 1., // v1
						 -1.,-1., 1.,  // V2
						  1., -1.,1.,
						  1., -1., -1.,
						  1., 1., -1.,
						  -1., 1., -1.,
						  -1., -1., -1.
						 ];

		this.indices = [0, 1, 2,  0, 2, 3, 	// Front face
						0, 3, 4,  0, 4, 5,	// Right face
						0, 5, 6,  0, 6, 1,	// Top face
						1, 6, 7,  1, 7, 2,	// Left face
						7, 4, 3,  7, 3, 2,	// Bottom face
						4, 7, 6,  4, 6, 5	// Back face
						];

		this.colors = [1., 1., 1., 1., 	 // V0: r,g,b,a
					   1., 0., 0., 1., // v1
					   0., 1., 0., 1., // V2
					   0., 0., 1., 1.,
					   0., 1., 1., 1.,
					   1., 1., 0., 1.,
					   1., 0., 1., 1.,
					   0., 0., 0., 1.
					  ];

		this.texture = [1., 1.,
						0., 1.,
						0., 0.,
						1., 0.,
						1., 0.,
						1., 1.,
						0., 1.,
						1., 0.
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
		var count = this.indices.length;
		gl.drawElements(primitiveType, count, gl.UNSIGNED_SHORT, 0);
	}
}

class Cube2 extends Model {
	constructor() {
		super();
		//Default
		this.positions = [
			1., -1., 1., // V0
			1., 1. , 1., // V1
			-1., 1., 1., // V2
			-1, -1, 1., // V3
			1, -1, -1, // V4
			1, 1, -1, // V5
			-1, 1, -1, // V6
			-1, -1, -1, // V7
			1., -1., 1., // V8
			1, -1, -1, // V9
			1, 1, -1, // V10
			1., 1., 1., // V11
			-1, 1, -1, // V12
			-1, -1, -1, // V13
			-1, -1, 1., // V14
			-1., 1., 1., // V15
			1., 1., 1., // V16
			1, 1, -1, // V17
			-1, 1, -1, // V18
			-1., 1., 1., // V19
			1., -1., 1., // V20
			1, -1, -1, // V21
			-1, -1, -1, // V22
			-1, -1, 1., // V23
		];

		this.indices = [
			0, 1, 2,  0, 2, 3,
			8, 9, 11,  9, 10, 11,
			16, 17, 18,  16, 18, 19,
			13, 14, 15,  13, 15, 12,
			23, 22, 20,  20, 22, 21,
			4, 6, 5,  4, 7, 6
		];

		this.colors = [
			1., 0., 0., 1.,   1., 0., 0., 1.,   1., 0., 0., 1.,   1., 0., 0., 1., 			 
			0., 1., 0., 1.,   0., 1., 0., 1.,   0., 1., 0., 1.,   0., 1., 0., 1.,
			0., 0., 1., 1.,   0., 0., 1., 1.,   0., 0., 1., 1.,   0., 0., 1., 1.,
			1., 0., 1., 1.,   1., 0., 1., 1.,   1., 0., 1., 1.,   1., 0., 1., 1.,
			0., 1., 1., 1.,   0., 1., 1., 1.,   0., 1., 1., 1.,   0., 1., 1., 1.,
			1., 1., 0., 1.,   1., 1., 0., 1.,   1., 1., 0., 1.,   1., 1., 0., 1.
		];

		this.texture = [
			1, 0, // V0
			1, 1, // V1
			0, 1, // V2
			0, 0, // V3
			1, 0, // V4
			1, 1, // V5
			0, 1, // V6
			0, 0, // V7
			1, 0, // V8
			1, 1, // V9
			0, 1, // V10
			0, 0, // V11
			1, 0, // V12
			1, 1, // V13
			0, 1, // V14
			0, 0, // V15
			1, 0, // V16
			1, 1, // V17
			0, 1, // V18
			0, 0, // V19
			1, 0, // V20
			1, 1, // V21
			0, 1, // V22
			0, 0, // V23
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
		var count = this.indices.length;
		gl.drawElements(primitiveType, count, gl.UNSIGNED_SHORT, 0);
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
		this.rotate(this.rotX, [1., 0., 0.]);
		this.rotate(this.rotY, [0., 1., 0.]);
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
	if(dragging)
	{
		var x = event.clientX;
		var y = event.clientY;
		var rect = event.target.getBoundingClientRect();
		x = x - rect.left;
		y = y - rect.top;
		dragMode = document.querySelector("input[name='camera']:checked").value;
		if(dragMode == "Rotate")
		{
			var factor = 10. / canvas.height; // The rotation ratio
			var dx = factor * (x - xLast);
			var dy = factor * (y - yLast);
			// Limit x-axis rotation angle to [-90, 90] degrees
			scene.camera.rotX = Math.max(Math.min(scene.camera.rotX + dy, 90.), -90.);
			scene.camera.rotY = scene.camera.rotY + dx;
		} else if(dragMode == "Pan")
		{ 				
			scene.camera.eye[0] = scene.camera.eye[0] + ((x - xLast) / 63.0);
			scene.camera.eye[1] = scene.camera.eye[1] + ((y - yLast) / (-63.0));
			scene.camera.center[0] = scene.camera.eye[0];
			scene.camera.center[1] = scene.camera.eye[1];
		} else if(dragMode == "Zoom")
		{
			var difX = x - xLast;
			var difY = y - yLast;
			if (Math.abs(difX) > Math.abs(difY))
			{
				scene.camera.eye[2] = scene.camera.eye[2] + difX / 10.0;
			}
			else
			{
				scene.camera.eye[2] = scene.camera.eye[2] + difY / 10.0;
			}
		}
		xLast = x;
		yLast = y;
		scene.update();
		scene.render();
	}
}

function buttonClickEventListener(event)
{
	if(event.target.id == "btn-home")
	{
		scene.camera.home();
		scene.update();
		scene.render();
	}
}

function initEventHandlers()
{
	canvas.addEventListener("mousedown", mouseDownEventListener, false);
	canvas.addEventListener("mouseup", mouseUpEventListener, false);
	canvas.addEventListener("mousemove", mouseMoveEventListener, false);
	document.getElementById("btn-home").addEventListener("click", buttonClickEventListener, false);
}

function main()
{
	canvas = document.getElementById("canvas");
	gl = canvas.getContext("webgl");	// Get a WebGL Context
	if(!gl)
	{
		return;
	}
	scene = new Scene();
	let cube1 = new Cube2();
	cube1.setDrawingMode("texture", "crate.png");
	// cube1.setDrawingMode("solid-per-vertex-color");
	// cube1.setDrawingMode("wireframe");
	scene.addModel(cube1);

	let camera1 = new Camera();
	scene.addCamera(camera1);
	
	scene.init();
	initEventHandlers();
	scene.render();
}
