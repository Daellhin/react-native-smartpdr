import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { WebView } from 'react-native-webview';

const html = require('../../../assets/html/graphIndex.html');

export function GraphScreen({ title, data }) {
  const [code, setCode] = useState(null);
  const webref = useRef(null);

  useEffect(() => {
    setCode(`
      function formatDate(date) {
        let m = date.getMinutes();
        let s = date.getSeconds();
        let ms = date.getMilliseconds();
        return m + ':' + s + '.' + ms;
      }
      var ctx = document.getElementById('chart').getContext('2d');
      var chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: '${title}',
              data: [],
              backgroundColor: 'rgba(0, 0, 0, 1)',
              borderColor: 'rgb(0, 0, 0, 1)',
              tension: 0.1,
            },
          ],
        },
        options: {
          fill: false,
          interaction: {
            intersect: true
          },
          radius: 0,
        },
      });
      true;
    `);
  }, []);

    useEffect(() => {
      let updateCode = `
        var step = chart.data.datasets[0].data;
        step.push(${data});
        chart.data.labels.push(formatDate(new Date()));

        if(step.length > 150) {
          step.shift();
          chart.data.labels.shift();
        }
        chart.update('none');
      `;
      webref.current.injectJavaScript(updateCode);
    }, [data]);

  return (
    <View style={styles.canvasContainer}>
      <View style={styles.canvas}>
        <WebView
          ref={webref}
          allowFileAccess={true}
          source={html}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={(event) => { }}
          injectedJavaScript={code}
          style={{ backgroundColor: 'transparent' }}
          renderLoading={() => {
            return (
              <ActivityIndicator
                style={{ position: 'absolute', width: '100%', height: '100%' }}
                animating={true}
                color={"theme.colors.primary"}
              />
            );
          }}
          startInLoadingState={true}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvasContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowRadius: 4,
    shadowOpacity: 0.3,
    elevation: 4,

  },
  canvas: {
    marginLeft: 120,
    overflow: 'hidden',
    width: Dimensions.get('window').width - 16,
    height: 270,
    marginVertical: 16,
    borderRadius: 8,
  },
});
