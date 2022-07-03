import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Dimensions, View, Text } from 'react-native';
import { Accelerometer, Magnetometer, Gyroscope } from 'expo-sensors';
import Canvas, { CanvasRenderingContext2D, Image } from 'react-native-canvas';
import { Asset } from 'expo-asset';
import Map from "../assets/drawing.svg";

// custom modules
import { range } from './utils/sensors_utils';
import { useHeading, useStepLength } from './utils/customHooks';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export function LocationScreen2({ navigation }) {
	// Listeners
	const [acc, setAcc] = useState({ x: 0, y: 0, z: 0 });
	const [mag, setMag] = useState({ x: 0, y: 0, z: 0 });
	const [gyr, setGyr] = useState({ x: 0, y: 0, z: 0 });
	const canvasRef = useRef(null);
	const [lineWidth, setLineWidth] = useState({ val: 2.5, sum: 0.2 });
	const [location, setLocation] = useState({ x: 0, y: 0 });

	const image = useMemo(() => {
		if (canvasRef.current) {
			const map = Asset.fromModule(require('../assets/firecommit_icon.png'))
			const image = new Image(canvasRef.current);
			image.src = map.uri;
			return image;
		}
	}, [canvasRef.current]);

	// Custom Hooks
	const heading = useHeading(acc, mag, gyr);
	const [stepLength, headingStep] = useStepLength(acc, mag, gyr);

	// Constant declarations
	const dt = 100;
	const windowWidth = Dimensions.get('window').width;
	const windowHeight = Dimensions.get('window').height - 64;

	Accelerometer.setUpdateInterval(dt);
	Magnetometer.setUpdateInterval(dt);
	Gyroscope.setUpdateInterval(dt);

	useEffect(() => {
		// TEMP: start location in midle of screen
		setLocation({ x: windowWidth / 2, y: windowHeight / 2 });

		Accelerometer.addListener((data) => {
			setAcc(data);
		});
		Magnetometer.addListener((data) => {
			setMag(data);
		});
		Gyroscope.addListener((data) => {
			setGyr(data);
		});
	}, [navigation]);

	useEffect(() => {
		if (lineWidth.val > 5 || lineWidth.val < 2.5) {
			setLineWidth((lw) => ({ ...lw, sum: -lw.sum }));
		}
		setLineWidth((lw) => ({ ...lw, val: lw.val + lw.sum }));
	}, [heading]);

	useEffect(() => {
		let nx = stepLength ? stepLength * Math.sin(headingStep) * 10 : 0;
		let ny = stepLength ? stepLength * Math.cos(headingStep) * 10 : 0;
		setLocation((previous) => ({ x: previous.x + nx, y: previous.y - ny }));
	}, [stepLength]);

	function describeArc(x, y, radius, startAngle, endAngle) {
		var start = polarToCartesian(x, y, radius, endAngle);
		var end = polarToCartesian(x, y, radius, startAngle);

		var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

		var d = [
			"M", start.x, start.y,
			"A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
		].join(" ");

		return d;
	}

	function polarToCartesian(centerX, centerY, radius, angleInRadians) {
		return {
			x: centerX + (radius * Math.cos(angleInRadians)),
			y: centerY + (radius * Math.sin(angleInRadians))
		}
	}

	const arcAngle = 80;
	const d = describeArc(location.x, location.y, 30,
		range(heading - Math.PI / 2 - ((arcAngle / 2) * Math.PI) / 180, '2PI'),
		range(heading - Math.PI / 2 + ((arcAngle / 2) * Math.PI) / 180, '2PI')
	);

	return (
		<View>
			<Text>{range(heading - Math.PI / 2 - (20 * Math.PI) / 180, '2PI')}</Text>
			<Svg viewBox={`0 0 ${windowWidth} ${windowHeight}`} style={{ backgroundColor: "lightgray" }}>
				<Circle
					cx={location.x} cy={location.y} r={30}
					strokeWidth={lineWidth.val}
					fill={"rgba(252, 129, 50, 0.1)"}
				/>
				<Circle
					cx={location.x} cy={location.y} r={10}
					stroke={"white"} strokeWidth={lineWidth.val}
					fill={"rgba(252, 129, 50, 0.25)"}
				/>
				<Path
					stroke="white" strokeWidth={6}
					d={d}
				/>
				<Map />
			</Svg>
		</View>
	);
}
