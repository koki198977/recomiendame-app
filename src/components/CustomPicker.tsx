import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Option {
  label: string;
  value: string;
}

interface Props {
  label: string;
  value: string | null;
  options: Option[];
  onChange: (value: string) => void;
}

export default function CustomPicker({ label, value, options, onChange }: Props) {
  const [visible, setVisible] = useState(false);

  const selectedLabel = options.find((opt) => opt.value === value)?.label;

  const handleOptionPress = (selectedValue: string) => {
    console.log('CustomPicker: Option selected:', selectedValue, 'for label:', label);
    onChange(selectedValue);
    setVisible(false);
  };

  const handleOpenPicker = () => {
    console.log('CustomPicker: Opening picker for:', label, 'with', options.length, 'options');
    setVisible(true);
  };

  const handleClosePicker = () => {
    console.log('CustomPicker: Closing picker for:', label);
    setVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        onPress={handleOpenPicker}
        style={styles.input}
        activeOpacity={0.7}
      >
        <Text style={styles.inputText}>
          {selectedLabel || `Selecciona ${label.toLowerCase()}`}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#aaa" />
      </TouchableOpacity>

      <Modal 
        visible={visible} 
        transparent 
        animationType="slide"
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={handleClosePicker}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleOptionPress(item.value)}
                  style={styles.option}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { color: 'white', marginBottom: 4 },
  input: {
    backgroundColor: '#27272a',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: { color: 'white' },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
    paddingVertical: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  optionText: {
    color: 'white',
    fontSize: 16,
  },
});
