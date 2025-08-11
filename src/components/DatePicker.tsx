import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Portal, Dialog, Text, Chip } from 'react-native-paper';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label: string;
  maximumDate?: Date;
}

export default function DatePicker({ value, onChange, label, maximumDate = new Date() }: DatePickerProps) {
  const [visible, setVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(value ? new Date(value).getFullYear() : new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(value ? new Date(value).getMonth() : new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(value ? new Date(value).getDate() : new Date().getDate());

  const currentYear = new Date().getFullYear();
  const maxYear = maximumDate.getFullYear();
  const minYear = 1900;

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const handleConfirm = () => {
    const year = selectedYear;
    const month = String(selectedMonth + 1).padStart(2, '0');
    const day = String(selectedDay).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    onChange(dateString);
    setVisible(false);
  };

  const handleCancel = () => {
    // Restaurar valores originales
    if (value) {
      const originalDate = new Date(value);
      setSelectedYear(originalDate.getFullYear());
      setSelectedMonth(originalDate.getMonth());
      setSelectedDay(originalDate.getDate());
    }
    setVisible(false);
  };

  const formatDisplayValue = () => {
    if (!value) return label;
    const date = new Date(value);
    return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
  };

  return (
    <>
      <Button
        mode="outlined"
        onPress={() => setVisible(true)}
        style={styles.button}
        theme={{ 
          colors: { 
            outline: '#444'
          } 
        }}
      >
        {formatDisplayValue()}
      </Button>

      <Portal>
        <Dialog visible={visible} onDismiss={handleCancel} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>Seleccionar fecha</Dialog.Title>
          
          <Dialog.Content>
            <View style={styles.container}>
              {/* Año */}
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Año</Text>
                <View style={styles.pickerContainer}>
                  <Button
                    mode="outlined"
                    onPress={() => setSelectedYear(Math.max(selectedYear - 1, minYear))}
                    disabled={selectedYear <= minYear}
                    style={styles.arrowButton}
                  >
                    ‹
                  </Button>
                  <Text variant="headlineSmall" style={styles.selectedValue}>
                    {selectedYear}
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={() => setSelectedYear(Math.min(selectedYear + 1, maxYear))}
                    disabled={selectedYear >= maxYear}
                    style={styles.arrowButton}
                  >
                    ›
                  </Button>
                </View>
              </View>

              {/* Mes */}
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Mes</Text>
                <View style={styles.pickerContainer}>
                  <Button
                    mode="outlined"
                    onPress={() => setSelectedMonth(selectedMonth === 0 ? 11 : selectedMonth - 1)}
                    style={styles.arrowButton}
                  >
                    ‹
                  </Button>
                  <Text variant="headlineSmall" style={styles.selectedValue}>
                    {months[selectedMonth]}
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={() => setSelectedMonth(selectedMonth === 11 ? 0 : selectedMonth + 1)}
                    style={styles.arrowButton}
                  >
                    ›
                  </Button>
                </View>
              </View>

              {/* Día */}
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Día</Text>
                <View style={styles.pickerContainer}>
                  <Button
                    mode="outlined"
                    onPress={() => setSelectedDay(Math.max(selectedDay - 1, 1))}
                    disabled={selectedDay <= 1}
                    style={styles.arrowButton}
                  >
                    ‹
                  </Button>
                  <Text variant="headlineSmall" style={styles.selectedValue}>
                    {selectedDay}
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={() => setSelectedDay(Math.min(selectedDay + 1, getDaysInMonth(selectedYear, selectedMonth)))}
                    disabled={selectedDay >= getDaysInMonth(selectedYear, selectedMonth)}
                    style={styles.arrowButton}
                  >
                    ›
                  </Button>
                </View>
              </View>

              {/* Fecha seleccionada */}
              <View style={styles.selectedDateContainer}>
                <Text variant="bodyMedium" style={styles.selectedDateLabel}>
                  Fecha seleccionada:
                </Text>
                <Chip 
                  mode="outlined" 
                  style={styles.selectedDateChip}
                  textStyle={styles.selectedDateChipText}
                >
                  {selectedDay} de {months[selectedMonth]} de {selectedYear}
                </Chip>
              </View>
            </View>
          </Dialog.Content>

          <Dialog.Actions style={styles.dialogActions}>
            <Button onPress={handleCancel} textColor="#666">
              Cancelar
            </Button>
            <Button onPress={handleConfirm} mode="contained">
              Confirmar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    marginBottom: 16,
  },
  dialog: {
    backgroundColor: '#1f1f1f',
  },
  dialogTitle: {
    color: '#fff',
    textAlign: 'center',
  },
  container: {
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  arrowButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderColor: '#444',
  },
  selectedValue: {
    color: '#fff',
    minWidth: 120,
    textAlign: 'center',
    fontWeight: '600',
  },
  selectedDateContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  selectedDateLabel: {
    color: '#aaa',
    marginBottom: 8,
  },
  selectedDateChip: {
    backgroundColor: '#333',
    borderColor: '#555',
  },
  selectedDateChipText: {
    color: '#fff',
  },
  dialogActions: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
});
