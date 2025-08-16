import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@park-angel/shared/src/lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface Vehicle {
  id: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  plate_number: string;
  is_default: boolean;
  created_at: string;
}

interface VehicleFormData {
  type: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  plate_number: string;
}

const VEHICLE_TYPES = ['Car', 'SUV', 'Truck', 'Van', 'Motorcycle', 'Bus'];
const VEHICLE_COLORS = [
  'White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Yellow',
  'Orange', 'Purple', 'Brown', 'Gold', 'Maroon', 'Navy', 'Pink'
];

export default function VehicleManagement() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<VehicleFormData>({
    type: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    plate_number: '',
  });
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      loadVehicles();
    }
  }, [user]);

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_vehicles')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error: any) {
      console.error('Error loading vehicles:', error);
      Alert.alert('Error', 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: '',
      brand: '',
      model: '',
      year: '',
      color: '',
      plate_number: '',
    });
    setEditingVehicle(null);
  };

  const handleAddVehicle = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setFormData({
      type: vehicle.type,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year.toString(),
      color: vehicle.color,
      plate_number: vehicle.plate_number,
    });
    setEditingVehicle(vehicle);
    setShowAddModal(true);
  };

  const handleSaveVehicle = async () => {
    if (!formData.type || !formData.brand || !formData.model || 
        !formData.year || !formData.color || !formData.plate_number) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const yearNum = parseInt(formData.year);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      Alert.alert('Error', 'Please enter a valid year');
      return;
    }

    try {
      setLoading(true);

      if (editingVehicle) {
        // Update existing vehicle
        const { error } = await supabase
          .from('user_vehicles')
          .update({
            type: formData.type,
            brand: formData.brand,
            model: formData.model,
            year: yearNum,
            color: formData.color,
            plate_number: formData.plate_number.toUpperCase(),
          })
          .eq('id', editingVehicle.id);

        if (error) throw error;
      } else {
        // Add new vehicle
        const isFirstVehicle = vehicles.length === 0;
        const { error } = await supabase
          .from('user_vehicles')
          .insert({
            user_id: user?.id,
            type: formData.type,
            brand: formData.brand,
            model: formData.model,
            year: yearNum,
            color: formData.color,
            plate_number: formData.plate_number.toUpperCase(),
            is_default: isFirstVehicle,
          });

        if (error) throw error;
      }

      setShowAddModal(false);
      resetForm();
      await loadVehicles();
      Alert.alert('Success', editingVehicle ? 'Vehicle updated successfully' : 'Vehicle added successfully');
    } catch (error: any) {
      console.error('Error saving vehicle:', error);
      Alert.alert('Error', 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete ${vehicle.brand} ${vehicle.model}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('user_vehicles')
                .delete()
                .eq('id', vehicle.id);

              if (error) throw error;

              // If deleted vehicle was default and there are other vehicles, make the first one default
              if (vehicle.is_default && vehicles.length > 1) {
                const remainingVehicles = vehicles.filter(v => v.id !== vehicle.id);
                if (remainingVehicles.length > 0) {
                  await supabase
                    .from('user_vehicles')
                    .update({ is_default: true })
                    .eq('id', remainingVehicles[0].id);
                }
              }

              await loadVehicles();
              Alert.alert('Success', 'Vehicle deleted successfully');
            } catch (error: any) {
              console.error('Error deleting vehicle:', error);
              Alert.alert('Error', 'Failed to delete vehicle');
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (vehicle: Vehicle) => {
    try {
      // Remove default from all vehicles
      await supabase
        .from('user_vehicles')
        .update({ is_default: false })
        .eq('user_id', user?.id);

      // Set new default
      const { error } = await supabase
        .from('user_vehicles')
        .update({ is_default: true })
        .eq('id', vehicle.id);

      if (error) throw error;

      await loadVehicles();
      Alert.alert('Success', 'Default vehicle updated');
    } catch (error: any) {
      console.error('Error setting default vehicle:', error);
      Alert.alert('Error', 'Failed to set default vehicle');
    }
  };

  const renderVehicleItem = ({ item }: { item: Vehicle }) => (
    <View className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="text-lg font-semibold text-gray-900">
              {item.brand} {item.model}
            </Text>
            {item.is_default && (
              <View className="ml-2 bg-purple-100 px-2 py-1 rounded-full">
                <Text className="text-purple-700 text-xs font-medium">Default</Text>
              </View>
            )}
          </View>
          <Text className="text-gray-600 mb-1">
            {item.year} • {item.type} • {item.color}
          </Text>
          <Text className="text-gray-800 font-medium">
            Plate: {item.plate_number}
          </Text>
        </View>
        <View className="flex-row space-x-2">
          <TouchableOpacity
            onPress={() => handleEditVehicle(item)}
            className="p-2"
          >
            <Ionicons name="pencil" size={20} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteVehicle(item)}
            className="p-2"
          >
            <Ionicons name="trash" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      {!item.is_default && (
        <TouchableOpacity
          onPress={() => handleSetDefault(item)}
          className="mt-2 py-2 px-3 bg-gray-100 rounded-lg"
        >
          <Text className="text-gray-700 text-center font-medium">
            Set as Default
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const DropdownModal = ({ 
    visible, 
    onClose, 
    options, 
    onSelect, 
    title 
  }: {
    visible: boolean;
    onClose: () => void;
    options: string[];
    onSelect: (option: string) => void;
    title: string;
  }) => (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl max-h-96">
          <View className="p-4 border-b border-gray-200">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-semibold">{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                className="p-4 border-b border-gray-100"
              >
                <Text className="text-gray-900">{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  if (loading && vehicles.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-600">Loading vehicles...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-2xl font-bold text-gray-900">My Vehicles</Text>
          <Text className="text-gray-600">Manage your registered vehicles</Text>
        </View>
        <TouchableOpacity
          onPress={handleAddVehicle}
          className="bg-purple-500 p-3 rounded-xl"
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Vehicles List */}
      {vehicles.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="car" size={64} color="#d1d5db" />
          <Text className="text-gray-500 text-lg mt-4 mb-2">No vehicles added</Text>
          <Text className="text-gray-400 text-center mb-6">
            Add your first vehicle to start parking
          </Text>
          <TouchableOpacity
            onPress={handleAddVehicle}
            className="bg-purple-500 py-3 px-6 rounded-xl"
          >
            <Text className="text-white font-semibold">Add Vehicle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          renderItem={renderVehicleItem}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add/Edit Vehicle Modal */}
      <Modal visible={showAddModal} animationType="slide">
        <View className="flex-1 bg-white">
          <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
            <Text className="text-xl font-bold">
              {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-6">
            {/* Vehicle Type */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Vehicle Type</Text>
              <TouchableOpacity
                onPress={() => setShowTypeDropdown(true)}
                className="border border-gray-300 rounded-xl px-4 py-3 flex-row justify-between items-center"
              >
                <Text className={formData.type ? 'text-gray-900' : 'text-gray-500'}>
                  {formData.type || 'Select vehicle type'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Brand */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Brand</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                placeholder="e.g., Toyota, Honda, Ford"
                value={formData.brand}
                onChangeText={(text) => setFormData({ ...formData, brand: text })}
              />
            </View>

            {/* Model */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Model</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                placeholder="e.g., Camry, Civic, F-150"
                value={formData.model}
                onChangeText={(text) => setFormData({ ...formData, model: text })}
              />
            </View>

            {/* Year */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Year</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                placeholder="e.g., 2020"
                value={formData.year}
                onChangeText={(text) => setFormData({ ...formData, year: text })}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            {/* Color */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Color</Text>
              <TouchableOpacity
                onPress={() => setShowColorDropdown(true)}
                className="border border-gray-300 rounded-xl px-4 py-3 flex-row justify-between items-center"
              >
                <Text className={formData.color ? 'text-gray-900' : 'text-gray-500'}>
                  {formData.color || 'Select color'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Plate Number */}
            <View className="mb-6">
              <Text className="text-gray-700 font-medium mb-2">Plate Number</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                placeholder="e.g., ABC-1234"
                value={formData.plate_number}
                onChangeText={(text) => setFormData({ ...formData, plate_number: text.toUpperCase() })}
                autoCapitalize="characters"
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSaveVehicle}
              disabled={loading}
              className={`py-4 px-8 rounded-xl ${
                loading ? 'bg-gray-300' : 'bg-purple-500'
              }`}
            >
              <Text className="text-white text-lg font-semibold text-center">
                {loading ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Dropdowns */}
      <DropdownModal
        visible={showTypeDropdown}
        onClose={() => setShowTypeDropdown(false)}
        options={VEHICLE_TYPES}
        onSelect={(type) => setFormData({ ...formData, type })}
        title="Select Vehicle Type"
      />

      <DropdownModal
        visible={showColorDropdown}
        onClose={() => setShowColorDropdown(false)}
        options={VEHICLE_COLORS}
        onSelect={(color) => setFormData({ ...formData, color })}
        title="Select Color"
      />
    </View>
  );
}