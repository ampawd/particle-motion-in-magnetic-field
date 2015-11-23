function setControls(params) {
	//	particle parallel speed
	const radToDeg = 180 / Math.PI;	
	const degToRad = Math.PI / 180;
	
	$( "#vx_slider" ).slider({
		range: "max",
		min: 0,
		max: 15,
		step: 1,
		value: 10,
		slide: function( event, ui ) {
			$( "#vx_amount" ).val( ui.value  );
		}
	});
	$( "#vx_amount" ).val( $( "#vx_slider" ).slider( "value" ) );	

	//	particle ortogonal speed
	$( "#vy_slider" ).slider({
		range: "max",
		min: 0,
		max: 15,
		step: 1,
		value: 10,
		slide: function( event, ui ) {
			$( "#vy_amount" ).val( ui.value  );
		}
	});
	$( "#vy_amount" ).val( $( "#vy_slider" ).slider( "value" ) );	
	
	//	B (induction) amount
	$( "#B_slider" ).slider({
		range: "max",
		min: 1,
		max: 3,
		step: 0.05,
		value: 1,
		slide: function( event, ui ) {
			$( "#B_amount" ).val( ui.value  );
		}
	});
	$( "#B_amount" ).val( $( "#B_slider" ).slider( "value" ) );	
	
	//	particle speed	
	$( "#v_slider" ).slider({
		range: "max",
		min: 1,
		max: 10,
		step: 1,
		value: 5,
		slide: function( event, ui ) {
			$( "#v_amount" ).val( ui.value  );
		}
	});
	$( "#v_amount" ).val( $( "#v_slider" ).slider( "value" ) );



	$( "#rotX_amount" ).val( params.startAngleX );
	$( "#rotX_slider" ).slider({
		range: "max",
		min: 0,
		max: Math.PI,
		step: 0.001,
		value: params.startAngleX*degToRad,
		slide: function( event, ui ) {
			$( "#rotX_amount" ).val( ui.value*radToDeg );
		}
	});
	
	$( "#rotY_amount" ).val( params.startAngleY );
	$( "#rotY_slider" ).slider({
		range: "max",
		min: 0,
		max: Math.PI,
		step: 0.001,
		value: params.startAngleY*degToRad,
		slide: function( event, ui ) {
			$( "#rotY_amount" ).val( ui.value*radToDeg );
		}
	});
	
	
	$( "#rotZ_amount" ).val( params.startAngleZ );
	$( "#rotZ_slider" ).slider({
		range: "max",
		min: 0,
		max: Math.PI,
		step: 0.001,
		value: params.startAngleZ*degToRad,
		slide: function( event, ui ) {
			$( "#rotZ_amount" ).val( ui.value*radToDeg );
		}
	});

	
	$("#charge_checkbox").attr("checked", false);
	$("#show_B").attr("checked", false);
}

function controlsSliding() {
	var params = $("#params");		
	var val = -params.height() + $("#buttons").height() + parseInt($("#buttons").css("margin-top")) - 5;
	$(params).css({"top": val});
	var toggled = false;
	
	$("#toggle-button").click(function() {
		if (!toggled) {
			$(this).html("hide")
		}	else {
			$(this).html("Show parameters")
		}
		$(params).animate({
			top: toggled ? val : -val/8
		});
		toggled = !toggled;
	});
}	

