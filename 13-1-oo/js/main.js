"use strict"

// global variables
var gl;
var canvas;

class Scene
{
	constructor()
	{
		this.listModels = [];
		// Set the clear Color
		gl.clearColor(0., 0., 0., 1.);	// black
	}

	addModel(model) 
	{
		this.listModels.push(model);
	}

	addCamera(camera) 
	{
		this.camera = camera;
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
	}

	loadVertices()
	{
		// Bind the VBO to ARRAY_BUFFER
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

		// Upload CPU's vertex data into the GPU's VBO
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.model.vertices), gl.STATIC_DRAW);
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
		this.buffer.loadVertices();
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
		this.buffer.loadVertices();
		this.shader.setPerVertexColorShader();
	}

	setPointShader()
	{
		this.vertices = this.positions;
		this.buffer.loadVertices();
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
		var count = 3;
		gl.drawArrays(primitiveType, offset, count);
	}
}

class Camera
{
	constructor()
	{
		this.lookAt(0., 0., 5., 0., 0., 0., 0., 1., 0.);
		this.setPerspective(); 
	}

	lookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ)
	{
		// View Transformation
		this.viewMatrix = mat4.create();		// Mview = I
		this.eye = [eyeX, eyeY, eyeZ];
		this.center = [centerX, centerY, centerZ];
		this.up = [upX, upY, upZ];
		mat4.lookAt(this.viewMatrix, this.eye, this.center, this.up);
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

function main()
{
	canvas = document.getElementById("canvas");
	gl = canvas.getContext("webgl");	// Get a WebGL Context
	if(!gl)
	{
		return;
	}
	var scene = new Scene();
	var triangle1 = new Triangle();
	triangle1.setColor(1., 0., 0., 1.);
	triangle1.setDrawingMode('solid-per-vertex-color');
	triangle1.translate(0.5, 0., 0.);
	scene.addModel(triangle1);

	var camera1 = new Camera();
	scene.addCamera(camera1);
	
	scene.render();
}
