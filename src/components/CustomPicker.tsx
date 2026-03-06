import React, { useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
} from 'react-native';
import { 
  Text, 
  Button, 
  List, 
  Portal, 
  Dialog, 
  Searchbar 
} from 'react-native-paper';
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
  const [searchQuery, setSearchQuery] = useState('');

  const selectedLabel = options.find((opt) => opt.value === value)?.label;

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOptionPress = (selectedValue: string) => {
    console.log('CustomPicker: Option selected:', selectedValue, 'for label:', label);
    onChange(selectedValue);
    setVisible(false);
    setSearchQuery('');
  };

  const handleOpenPicker = () => {
    console.log('CustomPicker: Opening picker for:', label, 'with', options.length, 'options');
    setVisible(true);
  };

  const handleClosePicker = () => {
    console.log('CustomPicker: Closing picker for:', label);
    setVisible(false);
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      <Text variant="labelMedium" style={styles.label}>{label}</Text>
      <Button
        mode="outlined"
        onPress={handleOpenPicker}
        style={styles.button}
        contentStyle={styles.buttonContent}
        icon={({ size, color }) => (
          <Ionicons name="chevron-down" size={size} color={color} />
        )}
      >
        {selectedLabel || `Selecciona ${label.toLowerCase()}`}
      </Button>

      <Portal>
        <Dialog visible={!!visible} onDismiss={handleClosePicker} style={styles.dialog}>
          <Dialog.Title>{label}</Dialog.Title>
          <Dialog.Content>
            <Searchbar
              placeholder="Buscar..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
            />
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <List.Item
                  title={item.label}
                  onPress={() => handleOptionPress(item.value)}
                  style={styles.listItem}
                  titleStyle={styles.listItemTitle}
                />
              )}
              showsVerticalScrollIndicator={false}
              style={styles.list}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleClosePicker}>Cancelar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    marginBottom: 16 
  },
  label: { 
    marginBottom: 8,
    color: '#ffffff'
  },
  button: {
    borderColor: '#444',
    backgroundColor: '#27272a',
  },
  buttonContent: {
    justifyContent: 'space-between',
  },
  dialog: {
    backgroundColor: '#1e1e1e',
  },
  searchbar: {
    marginBottom: 8,
    backgroundColor: '#27272a',
  },
  list: {
    maxHeight: 300,
  },
  listItem: {
    backgroundColor: 'transparent',
  },
  listItemTitle: {
    color: '#ffffff',
  },
});
