;(function($) {
	//	globals
	var renderer,
			scene,
			camera,
			runID,
			helixPath 			= [],	
			params = {
				Q: 							-1,
				vx: 						10,
				vy: 						10,			
				B: 							1,				
				v:							5,
				B_steps:				150,
				particleRadius:	10,
				startAngleX:		15,
				startAngleY:		70,
				startAngleZ:		0
			},
			
			labels = {
				B: {}
			};
	
	//	constant globals
	const radToDeg = 180 / Math.PI;	
	const degToRad = Math.PI / 180;	
	const scaleFactor = 1;	
	const ratio = window.innerWidth / window.innerHeight;
	const particleOffset = 200;
	const fovy = 55;
	const sceneBGColor = 0x555555;
	
	function init() {
		//	get renderer, camera and scene
		renderer = window.WebGLRenderingContext ? new THREE.WebGLRenderer({antialias: true}) : new THREE.CanvasRenderer(); 
		//camera = new THREE.PerspectiveCamera(fovy, ratio, 0.1, 2000); 
			//camera.position.set(0, 0, 850);																																				//	needed for perspective camera

		camera = new THREE.OrthographicCamera( -window.innerWidth/2, window.innerWidth/2, window.innerHeight/2, -window.innerHeight/2, -2000, 2000 );
		scene = new THREE.Scene();		
		camera.lookAt(new THREE.Vector3(0, 0, 0));		
		renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(renderer.domElement);
		renderer.setClearColor( sceneBGColor, 1 );
		
		//	labels
		labels.B = createTextOn2DCanvas("B", 0, 100, 100, 100, true, 50);
		$(labels.B).css({"left": -150 + window.innerWidth/2 + "px"});
		
		//	controls
		setControls(params);
	}

	function initDefaults() {
		if ($("#show_B").attr("checked")) {			
			scene.add(magnetic_vecs);
		}

		$("#params").mousedown(function() { return false; });		
	}
	
	//	create cube
	function Cube(c1, c2, c3) {
		var geometry = new THREE.CubeGeometry(c1, c2, c3); 
		for ( var i = 0; i < geometry.faces.length; i++ ) {
			geometry.faces[ i ].color.setHex( Math.random() * 0xcccccc );
		}

		var material = new THREE.MeshLambertMaterial( { color: 0xcccccc, vertexColors: THREE.FaceColors }); 
		var cube = new THREE.Mesh(geometry, material);		
		return cube;
	}
	
	function WorldAxes(length, addLetters, position, hexColor) {
		var axes = new THREE.Object3D();		
		axes.add( buildSegment( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( length, 0, 0 ), hexColor.x, false ) ); // +X
		axes.add( buildSegment( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( -length, 0, 0 ), hexColor.x, true) ); 	// -X
		axes.add( buildSegment( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, length, 0 ), hexColor.y, false ) ); // +Y
		axes.add( buildSegment( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, -length, 0 ), hexColor.y, true ) ); // -Y
		axes.add( buildSegment( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, length ), hexColor.z, false ) ); // +Z
		axes.add( buildSegment( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, -length ), hexColor.z, true ) ); // -Z		
		axes.position.set(position && position.x || 0, position && position.y || 0, position && position.z || 0);	
		
		if (addLetters) {
			//...
		}
		return axes;
	}

	function OrtogonalVectors(length, position, hexColor) {
		var vecs = new THREE.Object3D();
		if (params.Q < 0) {
			//alert()
			vecs.add( buildSegment( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( -10*params.vy*params.B, 0, 0 ),hexColor.x, true) ); //		F lorenz
			vecs.add( buildSegment( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, params.vy*10, 0 ), hexColor.y, false ) ); // +Y		
			vecs.add( buildSegment( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, params.vx*10	), hexColor.z, false ) ); // +X					
		} else {			
			vecs.add( buildSegment( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( -10*params.vy*params.B, 0, 0 ),hexColor.x, true) ); 	
			vecs.add( buildSegment( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, -params.vy*10, 0 ), hexColor.y, false ) );		
			vecs.add( buildSegment( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, params.vx*10 ), hexColor.z, false ) );	
		}

		var size = 15;
		vecs.position.set(position && position.x || 0, position && position.y || 0, position && position.z || 0);
		var fl = createTextTHREE("F", size);
		fl.position.set(-125, 0, 0);
		fl.rotation.set(0, 0, params.Q < 0 ? 0 : Math.PI);
		fl.name = "fl";
		vecs.add(fl);	
		
		var Vx = createTextTHREE("Vx", size);
		var Vy = createTextTHREE("Vy", size);
		Vx.position.set(0, 0, 100);
		Vy.position.set(0, params.Q < 0 ? 100 : -100, 0);
		Vx.rotation.set(0, 0, params.Q < 0 ? 0 : Math.PI);
		Vy.rotation.set(0, 0, params.Q < 0 ? 0 : Math.PI);
		vecs.add(Vx);
		vecs.add(Vy);
		return vecs;
	}
	
	function buildSegment( src, dst, colorHex, dashed ) {
		var geom = new THREE.Geometry(),	mat;	
		if	(dashed) {
			mat = new THREE.LineDashedMaterial({ linewidth: 3, color: colorHex, dashSize: 3, gapSize: 5 });
		} else {
			mat = new THREE.LineBasicMaterial({ linewidth: 3, color: colorHex });
		}		
		//geom.vertices.push( src.clone() );
		//geom.vertices.push( dst.clone() );
		//geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines	
		//var axis = new THREE.Line( geom, mat, THREE.LinePieces );
		var axis = ArrowedVector(src, dst, colorHex, 0, 0);	
		return axis;
	}
	
	function MagneticVectors() {
		var parent = new THREE.Object3D(),
				vcolor = 0x888888,	//	0x00AAFF
				from,
				to,
				vec,
				step = params.B_steps*0.5,
				z0 = -length/1.5,
				z1 = length/1.5,
				midZ = (z0+z1)*0.5,	t = 3;
				for (var j = -t*step, l1 = -j; j <= l1; j += step) {
					for (var i = -l1; i <= l1; i += step) {
						from = new THREE.Vector3( i, j, -z1);
						to = new THREE.Vector3( i, j, midZ);
						vec = ArrowedVector(from, to, vcolor, true);
						parent.add(vec);
						
						from = new THREE.Vector3( i, j, midZ);
						to = new THREE.Vector3( i, j, z1);
						vec = ArrowedVector(from, to, vcolor, false);
						parent.add(vec);
					}
				}				
			return parent;
	}
	
	function ArrowedVector(from, to, color, addCircle, unit) {
		var parent = new THREE.Object3D(),
				headLength = 25,
				headWidth = 7,
				direction = to.clone().sub(from),
				length = direction.length(),
				magnitudeVec = new THREE.ArrowHelper(direction.normalize(), from, unit ? 1 : length, color, headLength, headWidth );
				parent.add( magnitudeVec );
				if (addCircle)
					parent.add( circle(10, from.x, from.y, from.z, color) );				
		return parent;
	}
	
	//	helix curve
	function HelixCurve(vy, vx, B, Q) {
		var lineMaterial = new THREE.LineBasicMaterial({
			color: 0x887700,
			linewidth: 4
		});
		
		if ('undefined' === typeof Q) {
			Q = 1;			
		}
		
		var line, lineGeometry,
				x = 0,
				y = 0,
				z = 0,
				t = 0,
				alpha = 0,
				distance = 360*(vx==0?1:vx),
				c = vx*(1/B),
				phase = 0;				
				vy -= B;
				if (vy < 0)
					vy = 0;
					
				vy *= 10;
				helixPath = [];
				lineGeometry = new THREE.Geometry();
				for (alpha = 0; alpha <= distance; alpha += 1) {					
					t = alpha*degToRad;
					x = vy*Math.cos(t*(-Q) - phase) / scaleFactor;
					y = vy*Math.sin(t*(-Q) - phase) / scaleFactor;
					z = c*t / scaleFactor;					
					helixPath.push( new THREE.Vector3(x, y, z) );					
					lineGeometry.vertices.push(new THREE.Vector3(x, y, z));	
				}
				line = new THREE.Line(lineGeometry, lineMaterial);		
				return line;
	}
	
	function Sphere(R) {
		var geometry = new THREE.SphereGeometry( R, 15, 15 );
		var material = new THREE.MeshBasicMaterial( {color: 0x0f0ecc} );
		var sphere = new THREE.Mesh( geometry, material );
		return sphere;
	}

	function circle(R, x0, y0, z0, lineColor) {
		var parent = new THREE.Object3D(), cmaterial, circleGeometry;	
		cmaterial = new THREE.MeshBasicMaterial( { color: 0x888888, side: THREE.DoubleSide } );
		circleGeometry = new THREE.CircleGeometry( R, 64 ),	
		parent.add(new THREE.Mesh(circleGeometry, cmaterial));																	//	back circle

		circleGeometry = new THREE.CircleGeometry( R, 64 );
		cmaterial = new THREE.LineBasicMaterial( { color: 0x000000 } );												//	circle path
		parent.add(new THREE.Line(circleGeometry, cmaterial));
		parent.rotation.set(0, 0, Math.PI/4);
		
		var	christLineGeometry = new THREE.Geometry();																				//	crhists ?!
		var lmaterial = new THREE.LineBasicMaterial( { color: sceneBGColor   } );
		christLineGeometry.vertices.push(new THREE.Vector3(x0-R, y0-R, z0)); 
		christLineGeometry.vertices.push(new THREE.Vector3(x0+R, y0+R, z0));
		var line = new THREE.Line(christLineGeometry, lmaterial);
		scene.add(line);																												//	hiding weird line
	
		//christLineGeometry = new THREE.Geometry();		
		//christLineGeometry.vertices.push(new THREE.Vector3(x0-R, y0+R, z0)); 
		//christLineGeometry.vertices.push(new THREE.Vector3(x0+R, y0-R, z0));
		//scene.add(new THREE.Line(christLineGeometry, lmaterial));	
		//line = new THREE.Line(christLineGeometry, lmaterial);
		//scene.add(line);
		
		parent.position.set(x0, y0, z0);
		return parent;
	}
	
	function renderOnDrag(inititalRender) {
		if (inititalRender) {
			renderer.render(scene, camera);		
		}		
		
		$(renderer.domElement).off("mousedown");
		$(renderer.domElement).off("mousemove");
		$(renderer.domElement).off("mouseup");
		$(renderer.domElement).on("mousedown", function(e) {			
			var startX = e.clientX,
				startY = e.clientY,		
				diffX = startX, 
				diffY =	startY,
				rotX, rotY;
			
			$(renderer.domElement).on("mousemove", function(ee) {
				diffX = ee.clientX - startX;
				diffY = ee.clientY - startY;				
				scene.rotation.x += diffY / 200;
				scene.rotation.y += diffX / 200;				
				rotX = (scene.rotation.x*radToDeg).toFixed(0);
				rotY = (scene.rotation.y*radToDeg).toFixed(0);
				startX = ee.clientX;	
				startY = ee.clientY;	
				
				$("#rotX_amount").val( rotX );
				$("#rotY_amount").val( rotY );				
				$("#rotX_slider").slider( "value", scene.rotation.x );
				$("#rotY_slider").slider( "value", scene.rotation.y );						
				params.startAngleX = scene.rotation.x*radToDeg;
				params.startAngleY = scene.rotation.y*radToDeg;
				params.startAngleZ = scene.rotation.z*radToDeg;
				
				renderer.render(scene, camera);
			});
		});
			
		$(document).on("mouseup", function(e) {			
			$(renderer.domElement).off("mousemove");
		});
	}
	
	function createTextOn2DCanvas(text, x, y, w, h, addTopArrow, fontSize) {
		var cnv = document.createElement("canvas"), ctx;
		$(document.body).append(cnv);
		ctx = cnv.getContext("2d");
		cnv.width = 100;
		cnv.height = 100;	
		ctx.font = fontSize + "px Georgia";
		ctx.fillText(text, 0, y);
		function canvas_arrow(fromx, fromy, tox, toy){
			var headlen = 10;
			var angle = Math.atan2(toy-fromy, tox-fromx);
			ctx.moveTo(fromx, fromy);
			ctx.lineTo(tox, toy);
			ctx.lineTo(tox-headlen*Math.cos(angle-Math.PI/6), toy-headlen*Math.sin(angle-Math.PI/6));
			ctx.moveTo(tox, toy);
			ctx.lineTo(tox-headlen*Math.cos(angle+Math.PI/6), toy-headlen*Math.sin(angle+Math.PI/6));
		}
		if (addTopArrow) {
			ctx.beginPath();
			canvas_arrow(x, y-50, x+35, 50);	
			ctx.stroke();
		}	
		$(cnv).css({"left": x, "top": y});
		return cnv;
	}
	
	function createTextTHREE(text, size) {
		var textShapes = THREE.FontUtils.generateShapes( text,	{
				'font': 					'helvetiker',
				'weight': 				'normal',
				'style': 					'normal',
				'size': 					size,
				'curveSegments':	300
			}
		);
		var textg = new THREE.ShapeGeometry( textShapes );
		var textMesh = new THREE.Mesh( textg, new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.DoubleSide } ) ) ;
		return textMesh;
	}

	function updateParent(params) {
		var
			particle = Sphere(params.particleRadius),
			helixCurve = HelixCurve(params.vy, params.vx, params.B, params.Q),			
			parent = new THREE.Object3D(), 
			helixAndParticle = new THREE.Object3D(),
			
			l = helixCurve.geometry.vertices.length,
			start = helixCurve.geometry.vertices[0],
			end = helixCurve.geometry.vertices[l-1];			
			
			helixCurve.name = "helixCurve";
			var vx = params.vx, vy = params.vy;		
			length = Math.sqrt((end.x-start.x)*(end.x-start.x) + 
												 (end.y-start.y)*(end.y-start.y) + 
												 (end.z-start.z)*(end.z-start.z));
			var velocity_xyf = OrtogonalVectors(100, new THREE.Vector3(0, 0, 0), {x: 0x000000, y: 0x00FF00, z: 0x0000FF}),
			velScalar = ArrowedVector(
													new THREE.Vector3(particle.position.x, particle.position.y, particle.position.z),
													new THREE.Vector3(0, 10*params.vy*(-params.Q), 10*params.vx),													
													0xAA0FFF,
													false);			
			velScalar.name = "velScalar";
			velocity_xyf.name = "velocity_xyf";			
			helixAndParticle.add(particle);
			helixAndParticle.add(helixCurve);			
			parent.add(helixAndParticle);
			particle.add(velocity_xyf);					
			particle.add(velScalar);
		return parent;
	}
	
	function updateScene() {
		helixAndParticle = parent.children[0],
		particle = parent.children[0].children[0];
		var a = params.vy*0.5*20;

		helixAndParticle.rotation.set(0, 0, params.Q < 0 ? 0: Math.PI);		
		helixAndParticle.position.set(params.Q < 0 ? -a : a, 0, -length/2);																					//	centering helix curve and particle		
		scene.rotation.set(params.startAngleX*degToRad, params.startAngleY*degToRad, params.startAngleZ*degToRad);		
		particle.position.set(helixPath[0].x, helixPath[0].y, helixPath[0].z);																			//	place particle at the helix curve begining
		renderOnDrag(false);
		renderer.render(scene, camera);
	}

	function handleControlsInput() {
		var rotZAmount = 0, i = 0;
		var runParticle = function(i, angle) {
			runID = requestAnimationFrame(function() { 
				runParticle(i, angle);
			});
			
			if (i < helixPath.length) {
				particle.position.set(helixPath[i].x, helixPath[i].y, helixPath[i].z);
				particle.rotation.set(0, 0, rotZAmount += (angle*params.v));
				i += params.v;
			} else {
				//changing params.v causes weird ending
				if (runID) {
					cancelAnimationFrame(runID);
				}
			}
			renderer.render(scene, camera);			
		},
		
		stopParticle = function() {
			if (runID) {
				cancelAnimationFrame(runID);		
			}
		};
		
		var	running = false;
		$("#run_particle").click(function() {
			if (!running) {
				$(this).html("Again");
				runParticle(i, -2*Math.atan2(helixPath[1].x-helixPath[0].x, helixPath[1].y-helixPath[0].y)	);
			}	else {
				$(this).html("Run");
				stopParticle();
			}
			
			rotZAmount = 0; i = 0;
			particle.position.set(helixPath[0].x, helixPath[0].y, helixPath[0].z);
			particle.rotation.set(0, 0, 0);	
			renderer.render(scene, camera);
			running = !running;
		});
		
		
		$("#again").click(function(e) {
			running = false;
			$("#run_particle").html("Run");
			stopParticle();
			rotZAmount = 0; i = 0;
			particle.position.set(helixPath[0].x, helixPath[0].y, helixPath[0].z);
			particle.rotation.set(0, 0, 0);
			renderer.render(scene, camera);
		});
		
		//	particle Q (charge) change
		$("#Q_checkbox").click(function() {		
			scene.remove(parent);			
			if (this.checked) {				
				params.Q = 1;
				$("#Q_sign").html("-");
			} else {
				params.Q = -1;				
				$("#Q_sign").html("+");
			}
			parent = updateParent(params);
			scene.add(parent);
			updateScene();
		});
		
		//	vx change
		$( "#vx_slider" ).slider({
			slide: function( event, ui ) {
				scene.remove(parent);
				params.vx = ui.value;
				parent = updateParent(params);
				scene.add(parent);
				$( "#vx_amount" ).val( ui.value  );	
				updateScene();
			}
		});
		
		//	vy change
		$( "#vy_slider" ).slider({
			slide: function( event, ui ) {
				scene.remove(parent);
				params.vy = ui.value;
				parent = updateParent(params);
				scene.add(parent);
				$( "#vy_amount" ).val( ui.value );
				updateScene();
			}
		});
		
		$( "#B_slider" ).slider({
			slide: function( event, ui ) {
				scene.remove(parent);
				params.B = ui.value;
				parent = updateParent(params);
				scene.add(parent);
				$( "#B_amount" ).val( ui.value  );				
				updateScene();
			}
		});
		
		$( "#v_slider" ).slider({
			slide: function( event, ui ) {
				scene.remove(parent);
				params.v = ui.value;
				parent = updateParent(params);
				scene.add(parent);
				$( "#v_amount" ).val( ui.value  );				
				updateScene();
			}
		});
		
		var rotX0 = -params.startAngleX;
		var amountx = 0;
		$( "#rotX_slider" ).slider({
			slide: function( event, ui ) {
				if (parseFloat(ui.value) < rotX0) {
					amountx = -parseFloat(ui.value);
				} else {
					amountx = parseFloat(ui.value);
				}				
				scene.rotation.x = amountx;
				params.startAngleX = amountx*radToDeg;
				$( "#rotX_amount" ).val( Math.round(Math.abs(amountx*radToDeg)) );
				renderer.render(scene, camera);
			}
		});
		
		var rotY0 = -params.startAngleY;
		var amounty = 0;
		$( "#rotY_slider" ).slider({
			slide: function( event, ui ) {
				if (parseFloat(ui.value) < rotY0) {
					amounty = -parseFloat(ui.value);
				} else {
					amounty = parseFloat(ui.value);
				}	
				scene.rotation.y = amounty;
				params.startAngleY = amounty*radToDeg;
				$( "#rotY_amount" ).val( Math.round(Math.abs(amounty*radToDeg)) );
				renderer.render(scene, camera);
			}
		});
		
		var rotZ0 = -params.startAngleZ;
		var amountz = 0;
		$( "#rotZ_slider" ).slider({
			slide: function( event, ui ) {
				if (parseFloat(ui.value) < rotZ0) {
					amountz = -parseFloat(ui.value);
				} else {
					amountz = parseFloat(ui.value);
				}				
				scene.rotation.z = amountz;
				params.startAngleZ = amountz*radToDeg;
				$( "#rotZ_amount" ).val( Math.round(Math.abs(amountz*radToDeg)) );
				renderer.render(scene, camera);
			}
		});
		
		$("#show_B").click(function(e) {
			if (this.checked) {
				scene.add(magnetic_vecs);
			} else {
				scene.remove(magnetic_vecs);
			}
			
			renderer.render(scene, camera)
		});
	}
	
	init();

	var																																						//	helix path array index
		length = 0,
		parent = updateParent(params),
		magnetic_vecs = MagneticVectors(),
		helixAndParticle = parent.children[0],
		axes = WorldAxes(window.innerWidth/2, true, new THREE.Vector3(200, 0, -200), {x: 0xFF0000, y: 0x00FF00, z: 0x0000FF}),
		particle = parent.children[0].children[0];
	
	parent.name = "parent";
	helixAndParticle.name = "helixAndParticle";
	magnetic_vecs.name = "magnetic_vecs";
	
	scene.add(parent);
	scene.add(axes);	
	
	//	initial positions				
	helixAndParticle.position.set(-params.vy*0.5*20, 0, -length/2);													//	centering helix curve and particle	
	scene.rotation.set(params.startAngleX*degToRad, params.startAngleY*degToRad, params.startAngleZ*degToRad);		//	initial rotate by 70 deg							
	particle.position.set(helixPath[0].x, helixPath[0].y, helixPath[0].z);									//	place particle at the helix curve begining	
	
	handleControlsInput();
	controlsSliding();
	initDefaults();
	renderOnDrag(true);	
})(jQuery);