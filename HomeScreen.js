import React, { useState } from 'react';
import { Text, SafeAreaView, StyleSheet, Button, View, TouchableOpacity } from 'react-native';
import { presets } from './presets/presets';
import presetesScreen from './presets/presetsScreen';


export default function HomeScreen({navigation}) {

  const [model, setModel] = useState("preset");

  return (
    <SafeAreaView style={styles.container}>
     
      <Text style={styles.paragraph}>Hãy chọn chế độ chụp</Text>

      <TouchableOpacity style={styles.button} onPress={()=> navigation.navigate("Preset")}>
        <Text style={styles.buttonText}>Chọn chế độ có sẵn</Text>
      </TouchableOpacity> 

        <TouchableOpacity style ={styles.button} title="Chọn chế độ AI" onPress={() => setModel("ai")}>
        <Text style ={styles.buttonText} > Chọn chế độ AI</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} title="Chọn chế độ Random" onPress={() => setModel("random")} >
        <Text style={styles.buttonText}> Chọn chế độ Random</Text>
          </TouchableOpacity>
         
      
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 16,
  },
  paragraph: {
    marginBottom: 20,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  button: {
  backgroundColor: 'pink',
  padding: 10,
  marginVertical: 8,
  borderRadius: 8,
  marginLeft: 70,
  marginRight: 70,
  },
  buttonText: {
    textAlign: 'center'
  }


});
