import { Accelerometer, Gyroscope, Magnetometer } from 'expo-sensors';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Text, View } from 'react-native';
import Svg, { Circle, Path, SvgXml } from 'react-native-svg';
import SvgPanZoom, { SvgPanZoomElement } from 'react-native-svg-pan-zoom';
import Map from "../../assets/drawing.svg";
import { useHeading, useStepLength } from '../utils/customHooks';
import { range } from '../utils/sensors_utils';
import { describeArc } from '../utils/svgUtils';
import { degreesToRadians, radiansToDegrees } from '../utils/utils';

const mapp = `<svg
xmlns:dc="http://purl.org/dc/elements/1.1/"
xmlns:cc="http://creativecommons.org/ns#"
xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
xmlns:svg="http://www.w3.org/2000/svg"
xmlns="http://www.w3.org/2000/svg"
xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
width="210mm"
height="297mm"
viewBox="0 0 210 297"
version="1.1"
id="svg8"
inkscape:version="1.0.2 (e86c870879, 2021-01-15, custom)"
sodipodi:docname="drawing.svg">
<defs
  id="defs2" />
<sodipodi:namedview
  id="base"
  pagecolor="#ffffff"
  bordercolor="#666666"
  borderopacity="1.0"
  inkscape:pageopacity="0.0"
  inkscape:pageshadow="2"
  inkscape:zoom="0.7"
  inkscape:cx="317.02479"
  inkscape:cy="444.75515"
  inkscape:document-units="mm"
  inkscape:current-layer="layer1"
  inkscape:document-rotation="0"
  showgrid="false"
  inkscape:window-width="1920"
  inkscape:window-height="991"
  inkscape:window-x="-9"
  inkscape:window-y="-9"
  inkscape:window-maximized="1" />
<metadata
  id="metadata5">
 <rdf:RDF>
   <cc:Work
	  rdf:about="">
	 <dc:format>image/svg+xml</dc:format>
	 <dc:type
		rdf:resource="http://purl.org/dc/dcmitype/StillImage" />
	 <dc:title></dc:title>
   </cc:Work>
 </rdf:RDF>
</metadata>
<g
  inkscape:label="Layer 1"
  inkscape:groupmode="layer"
  id="layer1">
 <rect
	style="fill:none;stroke:#000000;stroke-width:2.3374;stroke-miterlimit:4;stroke-dasharray:none"
	id="rect833"
	width="71.265099"
	height="99.613312"
	x="12.559414"
	y="19.362982"
	ry="0" />
 <rect
	style="fill:none;stroke:#000000;stroke-width:2.165;stroke-miterlimit:4;stroke-dasharray:none"
	id="rect835"
	width="47.711208"
	height="47.916779"
	x="83.824509"
	y="19.362982" />
 <rect
	style="fill:none;stroke:#000000;stroke-width:2.165;stroke-miterlimit:4;stroke-dasharray:none"
	id="rect837"
	width="47.711205"
	height="96.005951"
	x="83.824509"
	y="67.279762" />
 <rect
	style="fill:none;stroke:#000000;stroke-width:2.165;stroke-miterlimit:4;stroke-dasharray:none"
	id="rect839"
	width="71.265091"
	height="44.30941"
	x="12.559414"
	y="118.9763" />
 <rect
	style="fill:none;stroke:#000000;stroke-width:2.165;stroke-miterlimit:4;stroke-dasharray:none"
	id="rect841"
	width="40.443443"
	height="55.184521"
	x="131.53572"
	y="67.279762" />
 <rect
	style="fill:none;stroke:#000000;stroke-width:2.165;stroke-miterlimit:4;stroke-dasharray:none"
	id="rect843"
	width="69.547615"
	height="47.916782"
	x="131.53572"
	y="19.362982" />
 <rect
	style="fill:none;stroke:#000000;stroke-width:2.165;stroke-miterlimit:4;stroke-dasharray:none"
	id="rect845"
	width="40.443443"
	height="40.821434"
	x="131.53572"
	y="122.46428" />
</g>
</svg>
`

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
	// TODO https://github.com/garblovians/react-native-svg-pan-zoom

	let a: any = null;
	return (
		<View>
			{isDebugEnabled &&
				<>
					<Text>Location| x:{location.x.toFixed(3)}, y:{location.y.toFixed(3)}</Text>
					<Text>Heading| {radiansToDegrees(heading).toFixed(2)}°</Text>
				</>
			}

			<SvgXml viewBox={`0 0 ${windowWidth} ${windowHeight}`} style={{ backgroundColor: "white" }} width={"100%"} height={"100%"} xml={mapp}> </SvgXml>
			<Svg viewBox={`0 0 ${windowWidth} ${windowHeight}`} style={{ zIndex: 1, position: 'absolute' }} width={"100%"} height={"100%"}>
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
			</Svg>
		</View>
	);
}