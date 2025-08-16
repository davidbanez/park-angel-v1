import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@park-angel/shared/src/lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface Transaction {
  id: string;
  booking_id: string;
  amount: number;
  discount_amount: number;
  vat_amount: number;
  total_amount: number;
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_type: 'parking' | 'hosted_parking' | 'advertisement' | 'refund';
  created_at: string;
  booking?: {
    spot?: {
      number: string;
      zone?: {
        name: string;
        section?: {
          name: string;
          location?: {
            name: string;
          };
        };
      };
    };
    start_time: string;
    end_time: string;
    vehicle?: {
      brand: string;
      model: string;
      plate_number: string;
    };
  };
}

interface FilterOptions {
  transactionType: string;
  paymentStatus: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
}

const TRANSACTION_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'parking', label: 'Parking' },
  { value: 'hosted_parking', label: 'Hosted Parking' },
  { value: 'advertisement', label: 'Advertisement' },
  { value: 'refund', label: 'Refund' },
];

const PAYMENT_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

export default function TransactionHistory() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<FilterOptions>({
    transactionType: '',
    paymentStatus: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
  });

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user, sortBy, sortOrder]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('transactions')
        .select(`
          *,
          booking:bookings(
            start_time,
            end_time,
            spot:parking_spots(
              number,
              zone:zones(
                name,
                section:sections(
                  name,
                  location:locations(name)
                )
              )
            ),
            vehicle:user_vehicles(
              brand,
              model,
              plate_number
            )
          )
        `)
        .eq('user_id', user?.id);

      // Apply filters
      if (filters.transactionType) {
        query = query.eq('transaction_type', filters.transactionType);
      }
      if (filters.paymentStatus) {
        query = query.eq('payment_status', filters.paymentStatus);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo + 'T23:59:59');
      }
      if (filters.minAmount) {
        query = query.gte('total_amount', parseFloat(filters.minAmount));
      }
      if (filters.maxAmount) {
        query = query.lte('total_amount', parseFloat(filters.maxAmount));
      }

      // Apply sorting
      const orderColumn = sortBy === 'date' ? 'created_at' : 'total_amount';
      query = query.order(orderColumn, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];

      // Apply search filter
      if (searchQuery) {
        filteredData = filteredData.filter(transaction => {
          const searchLower = searchQuery.toLowerCase();
          return (
            transaction.id.toLowerCase().includes(searchLower) ||
            transaction.transaction_type.toLowerCase().includes(searchLower) ||
            transaction.payment_method.toLowerCase().includes(searchLower) ||
            (transaction.booking?.spot?.zone?.section?.location?.name || '').toLowerCase().includes(searchLower) ||
            (transaction.booking?.vehicle?.plate_number || '').toLowerCase().includes(searchLower)
          );
        });
      }

      setTransactions(filteredData);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setShowFilters(false);
    loadTransactions();
  };

  const handleClearFilters = () => {
    setFilters({
      transactionType: '',
      paymentStatus: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
    });
    setSearchQuery('');
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'refunded':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'parking':
        return 'car';
      case 'hosted_parking':
        return 'home';
      case 'advertisement':
        return 'megaphone';
      case 'refund':
        return 'return-up-back';
      default:
        return 'receipt';
    }
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <View className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center flex-1">
          <View className="bg-purple-100 p-2 rounded-lg mr-3">
            <Ionicons 
              name={getTypeIcon(item.transaction_type) as any} 
              size={20} 
              color="#8b5cf6" 
            />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900 capitalize">
              {item.transaction_type.replace('_', ' ')}
            </Text>
            <Text className="text-gray-600 text-sm">
              {formatDate(item.created_at)}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-lg font-bold text-gray-900">
            {formatCurrency(item.total_amount)}
          </Text>
          <View className={`px-2 py-1 rounded-full ${getStatusColor(item.payment_status)}`}>
            <Text className="text-xs font-medium capitalize">
              {item.payment_status}
            </Text>
          </View>
        </View>
      </View>

      {/* Transaction Details */}
      <View className="border-t border-gray-100 pt-3">
        <View className="flex-row justify-between mb-1">
          <Text className="text-gray-600">Transaction ID:</Text>
          <Text className="text-gray-900 font-mono text-sm">
            {item.id.slice(0, 8)}...
          </Text>
        </View>
        
        <View className="flex-row justify-between mb-1">
          <Text className="text-gray-600">Payment Method:</Text>
          <Text className="text-gray-900 capitalize">
            {item.payment_method}
          </Text>
        </View>

        {item.booking && (
          <>
            {item.booking.spot && (
              <View className="flex-row justify-between mb-1">
                <Text className="text-gray-600">Location:</Text>
                <Text className="text-gray-900 text-right flex-1 ml-2">
                  {item.booking.spot.zone?.section?.location?.name} - 
                  Spot {item.booking.spot.number}
                </Text>
              </View>
            )}
            
            {item.booking.vehicle && (
              <View className="flex-row justify-between mb-1">
                <Text className="text-gray-600">Vehicle:</Text>
                <Text className="text-gray-900">
                  {item.booking.vehicle.brand} {item.booking.vehicle.model} 
                  ({item.booking.vehicle.plate_number})
                </Text>
              </View>
            )}

            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600">Duration:</Text>
              <Text className="text-gray-900">
                {formatDate(item.booking.start_time)} - {formatDate(item.booking.end_time)}
              </Text>
            </View>
          </>
        )}

        {/* Amount Breakdown */}
        {(item.discount_amount > 0 || item.vat_amount > 0) && (
          <View className="mt-2 pt-2 border-t border-gray-100">
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600">Base Amount:</Text>
              <Text className="text-gray-900">
                {formatCurrency(item.amount)}
              </Text>
            </View>
            
            {item.discount_amount > 0 && (
              <View className="flex-row justify-between mb-1">
                <Text className="text-gray-600">Discount:</Text>
                <Text className="text-green-600">
                  -{formatCurrency(item.discount_amount)}
                </Text>
              </View>
            )}
            
            {item.vat_amount > 0 && (
              <View className="flex-row justify-between mb-1">
                <Text className="text-gray-600">VAT:</Text>
                <Text className="text-gray-900">
                  {formatCurrency(item.vat_amount)}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-2xl font-bold text-gray-900">Transaction History</Text>
          <Text className="text-gray-600">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowFilters(true)}
          className="bg-purple-500 p-3 rounded-xl"
        >
          <Ionicons name="filter" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="mb-4">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            className="flex-1 ml-3 text-gray-900"
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={loadTransactions}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                loadTransactions();
              }}
            >
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sort Options */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row space-x-2">
          <TouchableOpacity
            onPress={() => {
              setSortBy('date');
              setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
            }}
            className={`flex-row items-center px-3 py-2 rounded-lg ${
              sortBy === 'date' ? 'bg-purple-100' : 'bg-gray-100'
            }`}
          >
            <Text className={`mr-1 ${sortBy === 'date' ? 'text-purple-700' : 'text-gray-700'}`}>
              Date
            </Text>
            <Ionicons 
              name={sortBy === 'date' && sortOrder === 'desc' ? 'chevron-down' : 'chevron-up'} 
              size={16} 
              color={sortBy === 'date' ? '#8b5cf6' : '#6b7280'} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              setSortBy('amount');
              setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
            }}
            className={`flex-row items-center px-3 py-2 rounded-lg ${
              sortBy === 'amount' ? 'bg-purple-100' : 'bg-gray-100'
            }`}
          >
            <Text className={`mr-1 ${sortBy === 'amount' ? 'text-purple-700' : 'text-gray-700'}`}>
              Amount
            </Text>
            <Ionicons 
              name={sortBy === 'amount' && sortOrder === 'desc' ? 'chevron-down' : 'chevron-up'} 
              size={16} 
              color={sortBy === 'amount' ? '#8b5cf6' : '#6b7280'} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Transactions List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600">Loading transactions...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
          <Text className="text-gray-500 text-lg mt-4 mb-2">No transactions found</Text>
          <Text className="text-gray-400 text-center">
            Your transaction history will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransactionItem}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={loadTransactions}
        />
      )}

      {/* Filters Modal */}
      <Modal visible={showFilters} animationType="slide">
        <View className="flex-1 bg-white">
          <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
            <Text className="text-xl font-bold">Filter Transactions</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View className="flex-1 p-6">
            {/* Transaction Type Filter */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Transaction Type</Text>
              <View className="flex-row flex-wrap">
                {TRANSACTION_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => setFilters({ ...filters, transactionType: type.value })}
                    className={`mr-2 mb-2 px-3 py-2 rounded-lg ${
                      filters.transactionType === type.value
                        ? 'bg-purple-500'
                        : 'bg-gray-200'
                    }`}
                  >
                    <Text
                      className={
                        filters.transactionType === type.value
                          ? 'text-white'
                          : 'text-gray-700'
                      }
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Payment Status Filter */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Payment Status</Text>
              <View className="flex-row flex-wrap">
                {PAYMENT_STATUSES.map((status) => (
                  <TouchableOpacity
                    key={status.value}
                    onPress={() => setFilters({ ...filters, paymentStatus: status.value })}
                    className={`mr-2 mb-2 px-3 py-2 rounded-lg ${
                      filters.paymentStatus === status.value
                        ? 'bg-purple-500'
                        : 'bg-gray-200'
                    }`}
                  >
                    <Text
                      className={
                        filters.paymentStatus === status.value
                          ? 'text-white'
                          : 'text-gray-700'
                      }
                    >
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date Range */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Date Range</Text>
              <View className="flex-row space-x-2">
                <View className="flex-1">
                  <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                    placeholder="From (YYYY-MM-DD)"
                    value={filters.dateFrom}
                    onChangeText={(text) => setFilters({ ...filters, dateFrom: text })}
                  />
                </View>
                <View className="flex-1">
                  <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                    placeholder="To (YYYY-MM-DD)"
                    value={filters.dateTo}
                    onChangeText={(text) => setFilters({ ...filters, dateTo: text })}
                  />
                </View>
              </View>
            </View>

            {/* Amount Range */}
            <View className="mb-6">
              <Text className="text-gray-700 font-medium mb-2">Amount Range</Text>
              <View className="flex-row space-x-2">
                <View className="flex-1">
                  <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                    placeholder="Min Amount"
                    value={filters.minAmount}
                    onChangeText={(text) => setFilters({ ...filters, minAmount: text })}
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                    placeholder="Max Amount"
                    value={filters.maxAmount}
                    onChangeText={(text) => setFilters({ ...filters, maxAmount: text })}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={handleClearFilters}
                className="flex-1 py-4 px-8 rounded-xl border border-gray-300"
              >
                <Text className="text-gray-700 text-lg font-semibold text-center">
                  Clear Filters
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleApplyFilters}
                className="flex-1 py-4 px-8 rounded-xl bg-purple-500"
              >
                <Text className="text-white text-lg font-semibold text-center">
                  Apply Filters
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}