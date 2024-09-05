// import React, { useState, useEffect } from 'react';
// import { WebView } from 'react-native-webview';
// import { mediaDevices } from 'react-native-webrtc';
// import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
// import { View, Text } from 'react-native';

// const ARChessWebView = () => {
//   const [hasCameraPermission, setHasCameraPermission] = useState(false);

//   useEffect(() => {
//     const requestCameraPermission = async () => {
//       const result = await request(PERMISSIONS.IOS.CAMERA);
//       if (result === RESULTS.GRANTED) {
//         setHasCameraPermission(true);
//       } else {
//         console.log('Camera permission denied');
//         // Handle permission denial if necessary
//       }
//     };

//     requestCameraPermission();
//   }, []);

//   useEffect(() => {
//     if (hasCameraPermission) {
//       mediaDevices.getUserMedia({
//         video: true,  // Request camera access
//       }).then(stream => {
//         // Use the stream (e.g., pass it to a video element or WebRTC)
//         console.log('Media stream obtained:', stream);
//       }).catch(error => {
//         console.error('Error accessing media devices:', error);
//       });
//     }
//   }, [hasCameraPermission]);

//   if (!hasCameraPermission) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <Text>Requesting Camera Permission...</Text>
//       </View>
//     );
//   }

//   return (
//     <WebView
//       originWhitelist={['*']}
//       source={{ html: `
//         <!DOCTYPE html>
//         <html lang="en">
//         <head>
//           <meta charset="UTF-8">
//           <meta name="viewport" content="width=device-width, initial-scale=1.0">
//           <title>AR Chess</title>
//           <style>
//             body { margin: 0; overflow: hidden; }
//           </style>
//         </head>
//         <body>
//           <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
//           <script src="https://jeromeetienne.github.io/AR.js/three.js/build/ar.js"></script>
//           <script>
//             // Initialize scene, camera, and renderer
//             const scene = new THREE.Scene();
//             const camera = new THREE.Camera();
//             const renderer = new THREE.WebGLRenderer({ alpha: true });
//             renderer.setSize(window.innerWidth, window.innerHeight);
//             document.body.appendChild(renderer.domElement);

//             // Add AR.js source and context
//             const source = new THREEx.ArToolkitSource({ sourceType: 'webcam' });
//             source.init(() => onResize());
//             window.addEventListener('resize', () => onResize());
//             const context = new THREEx.ArToolkitContext({
//               cameraParametersUrl: 'https://raw.githubusercontent.com/jeromeetienne/AR.js/master/three.js/data/camera_para.dat',
//               detectionMode: 'mono',
//             });
//             context.init(() => camera.projectionMatrix.copy(context.getProjectionMatrix()));

//             // Handle resizing
//             function onResize() {
//               source.onResizeElement();
//               source.copyElementSizeTo(renderer.domElement);
//               if (context.arController !== null) {
//                 source.copyElementSizeTo(context.arController.canvas);
//               }
//             }

//             // Update loop
//             function animate() {
//               requestAnimationFrame(animate);
//               if (source.ready === false) return;
//               context.update(source.domElement);
//               scene.visible = camera.visible;
//               renderer.render(scene, camera);
//             }
//             animate();

//             // Add lighting
//             const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
//             scene.add(ambientLight);

//             // Chessboard and pieces setup
//             const chessboardGeometry = new THREE.PlaneGeometry(2, 2);
//             const chessboardMaterial = new THREE.MeshBasicMaterial({ color: 0x884513, side: THREE.DoubleSide });
//             const chessboard = new THREE.Mesh(chessboardGeometry, chessboardMaterial);
//             chessboard.rotation.x = -Math.PI / 2;
//             scene.add(chessboard);

//             // Add chess pieces (example)
//             // Add 3D models of chess pieces here

//           </script>
//         </body>
//         </html>
//       ` }}
//     />
//   );
// };

// export default ARChessWebView;



import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ChessBoardAR = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>AR Chessboard will go here.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 320,
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ddd', // Placeholder background
    borderWidth: 2,
    borderColor: '#000',
  },
  text: {
    fontSize: 16,
    color: '#000',
  },
});

export default ChessBoardAR;
