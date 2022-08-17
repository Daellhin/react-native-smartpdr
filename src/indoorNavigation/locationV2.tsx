import { Accelerometer, Gyroscope, Magnetometer } from 'expo-sensors';
import React, { useEffect, useState } from 'react';
import { Dimensions, Text, View } from 'react-native';
import { Circle, Path, Rect } from 'react-native-svg';
import SvgPanZoom from 'react-native-svg-pan-zoom';
import Map from "../../assets/drawing.svg";
import { useHeading, useStepLength } from '../utils/customHooks';
import { range } from '../utils/sensors_utils';
import { describeArc } from '../utils/svgUtils';
import { degreesToRadians, radiansToDegrees } from '../utils/utils';
import { GraphScreen } from './graphs/graph-testing';

const updateInterval = 200;
const arcAngle = degreesToRadians(80 / 2); // The 'width' of the arc

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height - 64;

export function LocationScreen2({ navigation }) {
	const [lineWidth, setLineWidth] = useState({ val: 2.5, sum: 0.2 });
	const [isDebugEnabled, setIsDebugEnabled] = useState(true);

	const [accelerometerReading, setAccelerometerReading] = useState({ x: 0, y: 0, z: 0 });
	const [magnetometerReading, setMagnetometerReading] = useState({ x: 0, y: 0, z: 0 });
	const [gyroscopeReading, setGyroscopeReading] = useState({ x: 0, y: 0, z: 0 });

	const [location, setLocation] = useState({ x: 0, y: 0 });
	const heading = useHeading(accelerometerReading, magnetometerReading, gyroscopeReading);
	const [stepLength, headingStep] = useStepLength(accelerometerReading, magnetometerReading, gyroscopeReading);

	Accelerometer.setUpdateInterval(updateInterval);
	Magnetometer.setUpdateInterval(updateInterval);
	Gyroscope.setUpdateInterval(updateInterval);

	useEffect(() => {
		// TODO: let user determine start location
		setLocation({ x: windowWidth / 2, y: windowHeight / 2 });

		Accelerometer.addListener((data) => {
			setAccelerometerReading(data);
		});
		Magnetometer.addListener((data) => {
			setMagnetometerReading(data);
		});
		Gyroscope.addListener((data) => {
			setGyroscopeReading(data);
		});
	}, [navigation]);

	useEffect(() => {
		// Change lingewidth when heading changes
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

	const arcPath = describeArc(location.x, location.y, 30,
		range(heading - Math.PI / 2 - arcAngle, '2PI'),
		range(heading - Math.PI / 2 + arcAngle, '2PI')
	);

	return (
		<View>
			{isDebugEnabled &&
				<>
					<Text>Location| x:{location.x.toFixed(3)}, y:{location.y.toFixed(3)}</Text>
					<Text>Heading| {radiansToDegrees(heading).toFixed(2)}°</Text>
				</>
			}

			<View style={{ width: '100%', height: '100%' }}>
				<SvgPanZoom
					canvasHeight={500} canvasWidth={500}
					minScale={0.5} maxScale={2} initialZoom={0.7}
				>

					<Path
						stroke="white" strokeWidth={6}
						d={arcPath}
					/>
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
					<GraphScreen title={"test"} data={undefined}></GraphScreen>
					<Map width={"100%"} height={"100%"} />

				</SvgPanZoom>
			</View>
		</View>
	);
}