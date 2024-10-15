"use strict";

var shadedCube = function() {

    var canvas;
    var gl;

    var numPositions = 36;

    var positionsArray = [];
    var normalsArray = [];

    var vertices = [
        vec4(-0.5, -0.5,  0.5, 1.0),
        vec4(-0.5,  0.5,  0.5, 1.0),
        vec4(0.5,  0.5,  0.5, 1.0),
        vec4(0.5, -0.5,  0.5, 1.0),
        vec4(-0.5, -0.5, -0.5, 1.0),
        vec4(-0.5,  0.5, -0.5, 1.0),
        vec4(0.5,  0.5, -0.5, 1.0),
        vec4(0.5, -0.5, -0.5, 1.0)
    ];

    var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
    var lightAmbient = vec4(0.5, 0.5, 0.5, 1.0);
    var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
    var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

    var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
    var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
    var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
    var materialShininess = 20.0;

    var cubePositionX = 0.0;  // Initial horizontal position of the cube
    var cubePositionY = 0.0;  // Initial vertical position of the cube
    var moveDirectionX = 0;   // 0 means no horizontal movement, -1 for left, 1 for right
    var moveDirectionY = 0;   // 0 means no vertical movement, -1 for down, 1 for up
    var speed = 0.01;         // Default speed
    var cubeSize = 1.0;       // Cube Size

    var modelViewMatrix, projectionMatrix;
    var program;

    var xAxis = 0;
    var yAxis = 1;
    var zAxis = 2;
    var axis = 0;
    var theta = vec3(0, 0, 0);

    var thetaLoc;

    var flag = false;

    init();

    function quad(a, b, c, d) {
        var  t1= subtract(vertices[b], vertices[a]);
        var t2 = subtract(vertices[c], vertices[b]);
        var normal = cross(t1, t2);
        normal = vec3(normal);

        positionsArray.push(vertices[a]);
        normalsArray.push(normal);
        positionsArray.push(vertices[b]);
        normalsArray.push(normal);
        positionsArray.push(vertices[c]);
        normalsArray.push(normal);
        positionsArray.push(vertices[a]);
        normalsArray.push(normal);
        positionsArray.push(vertices[c]);
        normalsArray.push(normal);
        positionsArray.push(vertices[d]);
        normalsArray.push(normal);
    }

    function colorCube() {
        quad(1, 0, 3, 2);
        quad(2, 3, 7, 6);
        quad(3, 0, 4, 7);
        quad(6, 5, 1, 2);
        quad(4, 5, 6, 7);
        quad(5, 4, 0, 1);
    }

    function init() {
        canvas = document.getElementById("gl-canvas");
    
        gl = canvas.getContext('webgl2');
        if (!gl) alert("WebGL 2.0 isn't available");
    
        // Set the viewport to match the canvas size
        gl.viewport(0, 0, canvas.width, canvas.height);
    
        // Calculate the aspect ratio
        var aspect = canvas.width / canvas.height;
    
        // if (canvas.width >= canvas.height) {
        //     // Wide canvas
        //     projectionMatrix = ortho(-aspect * 1.5, aspect * 1.5, -1.5, 1.5, -100, 100);
        // } else {
        //     // Tall canvas
        //     projectionMatrix = ortho(-1.5 * aspect, 1.5 * aspect, -1.5, 1.5, -100, 100);
        // }


        if (canvas.width >= canvas.height) {
            // Wide canvas
            projectionMatrix = ortho(-aspect, aspect, -1, 1, -100, 100);
        } else {
            // Tall canvas
            projectionMatrix = ortho(-aspect, aspect, -1, 1, -100, 100);
        }
    
    
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
    
        program = initShaders(gl, "vertex-shader", "fragment-shader");
        gl.useProgram(program);
    
        colorCube();

        var nBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
    
        var normalLoc = gl.getAttribLocation(program, "aNormal");
        gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normalLoc);
    
        var vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);
    
        var positionLoc = gl.getAttribLocation(program, "aPosition");
        gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLoc);
    
        thetaLoc = gl.getUniformLocation(program, "theta");
    
        // Apply the updated projection matrix
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjectionMatrix"), false, flatten(projectionMatrix));
        
        //for the size
        document.getElementById("size").oninput = function() {
            cubeSize = parseFloat(document.getElementById("size").value);
            document.getElementById("sizeValue").textContent = cubeSize.toFixed(1); // Update displayed size value
        };

        document.getElementById("resetPosition").onclick = function() {
            resetCubePosition(); 
        };

        document.getElementById("resetCube").onclick = function() {
            resetCube(); 
        };
        
        // Update lighting and cube colors
        updateLighting();
        updateLightPosition();
        updateColors();
    
        // Add event listeners for rotation buttons
        document.getElementById("ButtonY").onclick = function() { axis = yAxis; };
        document.getElementById("ButtonZ").onclick = function() { axis = zAxis; };
        document.getElementById("ButtonT").onclick = function() { flag = !flag; };
    
        // Add event listeners for lighting controls
        document.getElementById("ambient").oninput = updateLighting;
        document.getElementById("diffuse").oninput = updateLighting;
        document.getElementById("specular").oninput = updateLighting;
    
        // Add event listeners for light position controls
        document.getElementById("lightX").oninput = updateLightPosition;
        document.getElementById("lightY").oninput = updateLightPosition;
        document.getElementById("lightZ").oninput = updateLightPosition;
    
        // Add event listeners for cube color controls
        document.getElementById("ambientR").oninput = updateColors;
        document.getElementById("ambientG").oninput = updateColors;
        document.getElementById("ambientB").oninput = updateColors;
        document.getElementById("ambientA").oninput = updateColors;
        document.getElementById("diffuseR").oninput = updateColors;
        document.getElementById("diffuseG").oninput = updateColors;
        document.getElementById("diffuseB").oninput = updateColors;
        document.getElementById("diffuseA").oninput = updateColors;
        document.getElementById("specularR").oninput = updateColors;
        document.getElementById("specularG").oninput = updateColors;
        document.getElementById("specularB").oninput = updateColors;
        document.getElementById("specularA").oninput = updateColors;
    
        // Add event listeners for cube movement
        document.getElementById("moveLeft").onclick = function() { moveDirectionX = -1; }; // Move left
        document.getElementById("moveRight").onclick = function() { moveDirectionX = 1; };  // Move right
        document.getElementById("moveUp").onclick = function() { moveDirectionY = 1; };     // Move up
        document.getElementById("moveDown").onclick = function() { moveDirectionY = -1; };  // Move down
        document.getElementById("stopMove").onclick = function() { moveDirectionX = 0; moveDirectionY = 0; }; // Stop movement
    
        // Update speed when the slider value changes
        document.getElementById("speed").oninput = function() {
            speed = parseFloat(document.getElementById("speed").value);
            document.getElementById("speedValue").textContent = speed.toFixed(3); // Update displayed speed value
        };
    
        // Start rendering the cube
        render();
    }

    function updateLighting() {
        var ambientValue = parseFloat(document.getElementById("ambient").value);
        var diffuseValue = parseFloat(document.getElementById("diffuse").value);
        var specularValue = parseFloat(document.getElementById("specular").value);

        var ambientProduct = mult(vec4(ambientValue, ambientValue, ambientValue, 1.0), materialAmbient);
        var diffuseProduct = mult(vec4(diffuseValue, diffuseValue, diffuseValue, 1.0), materialDiffuse);
        var specularProduct = mult(vec4(specularValue, specularValue, specularValue, 1.0), materialSpecular);

        gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"), ambientProduct);
        gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"), diffuseProduct);
        gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"), specularProduct);
        gl.uniform1f(gl.getUniformLocation(program, "uShininess"), materialShininess);
    }

    function updateLightPosition() {
        var lightX = parseFloat(document.getElementById("lightX").value);
        var lightY = parseFloat(document.getElementById("lightY").value);
        var lightZ = parseFloat(document.getElementById("lightZ").value);

        lightPosition = vec4(lightX, lightY, lightZ, 0.0);
        gl.uniform4fv(gl.getUniformLocation(program, "uLightPosition"), lightPosition);
    }

    function updateColors() {
        var ambientR = parseFloat(document.getElementById("ambientR").value);
        var ambientG = parseFloat(document.getElementById("ambientG").value);
        var ambientB = parseFloat(document.getElementById("ambientB").value);
        var ambientA = parseFloat(document.getElementById("ambientA").value);

        var diffuseR = parseFloat(document.getElementById("diffuseR").value);
        var diffuseG = parseFloat(document.getElementById("diffuseG").value);
        var diffuseB = parseFloat(document.getElementById("diffuseB").value);
        var diffuseA = parseFloat(document.getElementById("diffuseA").value);

        var specularR = parseFloat(document.getElementById("specularR").value);
        var specularG = parseFloat(document.getElementById("specularG").value);
        var specularB = parseFloat(document.getElementById("specularB").value);
        var specularA = parseFloat(document.getElementById("specularA").value);
        materialAmbient = vec4(ambientR, ambientG, ambientB, ambientA);
        materialDiffuse = vec4(diffuseR, diffuseG, diffuseB, diffuseA);
        materialSpecular = vec4(specularR, specularG, specularB, specularA);

        updateLighting();
    }

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        if (flag) theta[axis] += 2.0;
    
        // Update cube position based on speed and direction
        cubePositionX += moveDirectionX * speed; // Horizontal movement
        cubePositionY += moveDirectionY * speed; // Vertical movement
        
        // Get selected movement mode from dropdown
        var movementMode = document.getElementById("movementMode").value;
    
        // Handle boundaries based on movement mode
        if (movementMode === "bounce") {
            if (cubePositionX >= 1.0) {
                cubePositionX = 1.0;
                moveDirectionX = -1;
            }
            if (cubePositionX <= -1.0) {
                cubePositionX = -1.0;
                moveDirectionX = 1;
            }
            if (cubePositionY >= 1.0) {
                cubePositionY = 1.0;
                moveDirectionY = -1;
            }
            if (cubePositionY <= -1.0) {
                cubePositionY = -1.0;
                moveDirectionY = 1;
            }
        } else if (movementMode === "stop") {
            if (cubePositionX >= 1.0) {
                cubePositionX = 1.0;
                moveDirectionX = 0;
            }
            if (cubePositionX <= -1.0) {
                cubePositionX = -1.0;
                moveDirectionX = 0;
            }
            if (cubePositionY >= 1.0) {
                cubePositionY = 1.0;
                moveDirectionY = 0;
            }
            if (cubePositionY <= -1.0) {
                cubePositionY = -1.0;
                moveDirectionY = 0;
            }
        }
    
        // Apply transformations: move, scale, and rotate
        modelViewMatrix = mat4();
        modelViewMatrix = mult(modelViewMatrix, translate(cubePositionX, cubePositionY, 0.0)); // Move along X and Y axes
        
        // Apply scaling based on cubeSize
        modelViewMatrix = mult(modelViewMatrix, scale(cubeSize, cubeSize, cubeSize)); // Scale the cube
        
        modelViewMatrix = mult(modelViewMatrix, rotate(theta[xAxis], vec3(1, 0, 0)));
        modelViewMatrix = mult(modelViewMatrix, rotate(theta[yAxis], vec3(0, 1, 0)));
        modelViewMatrix = mult(modelViewMatrix, rotate(theta[zAxis], vec3(0, 0, 1)));
    
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "uModelViewMatrix"), false, flatten(modelViewMatrix));
        
        gl.uniform3fv(thetaLoc, flatten(theta));
        
        gl.drawArrays(gl.TRIANGLES, 0, numPositions);
        requestAnimationFrame(render);
    }

    function resetCubePosition() {
        cubePositionY = 0.0; 
        moveDirectionX = 0;  
        moveDirectionY = 0;  
    }

    function resetCube() {
        flag = false;
        theta = vec3(0, 0, 0);  

        cubePositionX = 0.0;  
        cubePositionY = 0.0; 
        moveDirectionX = 0;  
        moveDirectionY = 0;
        cubeSize = 1;          
    }
    

    function translate(x, y, z) {
        var result = mat4();
        result[0][3] = x;
        result[1][3] = y;
        result[2][3] = z;
        return result;
    }
}

shadedCube();
