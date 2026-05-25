import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Shipment,
  getAllShipments,
  createShipment,
  updateShipment,
  deleteShipment,
  updateTrackingInfo
} from '../services/shipmentService';
import {
  User,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserPermissions
} from '../services/userService';
import { sendShipperEmail, sendReceiverEmail } from '../services/emailService';
import { FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaSearch, FaFilter, FaSync, FaSpinner, FaEnvelope, FaChartLine, FaUsers, FaCog, FaShieldAlt } from 'react-icons/fa';
import Icon from '../components/icons/Icon';
import AnimatedCard from '../components/animations/AnimatedCard';
import { toast } from 'react-toastify';

type ShipmentFormData = {
  // Shipper Information
  shipperName: string;
  shipperAddress: string;
  shipperPhone: string;
  shipperEmail: string;
  
  // Receiver Information
  receiverName: string;
  receiverAddress: string;
  receiverPhone: string;
  receiverEmail: string;
  
  // Shipment Information
  origin: string;
  destination: string;
  carrier: string;
  typeOfShipment: string;
  shipmentMode: string;
  packageCount: number;
  product: string;
  productQuantity: number;
  paymentMode: string;
  totalFreight: number;
  weight: number;
  
  // Dates and Times
  expectedDeliveryDate: string;
  departureTime: string;
  pickupDate: string;
  pickupTime: string;
  
  // Package Details
  packages: Array<{
    quantity: number;
    pieceType: string;
    description: string;
    length: number;
    width: number;
    height: number;
    weight: number;
  }>;
  
  // Status and Comments
  status: 'pending' | 'in_transit' | 'delivered' | 'delayed' | 'on_hold';
  comments: string;
};

const defaultShipmentForm: ShipmentFormData = {
  shipperName: '',
  shipperAddress: '',
  shipperPhone: '',
  shipperEmail: '',
  receiverName: '',
  receiverAddress: '',
  receiverPhone: '',
  receiverEmail: '',
  origin: '',
  destination: '',
  carrier: '',
  typeOfShipment: '',
  shipmentMode: '',
  packageCount: 1,
  product: '',
  productQuantity: 1,
  paymentMode: '',
  totalFreight: 0,
  weight: 0,
  expectedDeliveryDate: '',
  departureTime: '',
  pickupDate: '',
  pickupTime: '',
  packages: [{
    quantity: 1,
    pieceType: '',
    description: '',
    length: 0,
    width: 0,
    height: 0,
    weight: 0
  }],
  status: 'pending',
  comments: ''
};

// Add these formatting functions at the top of the file after the imports
const formatPaymentMode = (mode: string) => {
  const formattingMap: { [key: string]: string } = {
    'bank_transfer': 'Bank Transfer',
    'credit_card': 'Credit Card',
    'cash': 'Cash',
    'check': 'Check'
  };
  return formattingMap[mode.toLowerCase()] || mode;
};

const formatShipmentType = (type: string) => {
  const formattingMap: { [key: string]: string } = {
    'standard': 'Standard',
    'express': 'Express',
    'economy': 'Economy'
  };
  return formattingMap[type.toLowerCase()] || type;
};

const formatShipmentMode = (mode: string) => {
  const formattingMap: { [key: string]: string } = {
    'land_shipping': 'Land Shipping',
    'air_shipping': 'Air Shipping',
    'sea_shipping': 'Sea Shipping'
  };
  return formattingMap[mode.toLowerCase()] || mode;
};

const AdministrationAndDevelopment: React.FC = () => {
  const { logout, user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  // State for shipments
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showShipmentForm, setShowShipmentForm] = useState(false);
  const [showTrackingForm, setShowTrackingForm] = useState(false);

  // Form states
  const [shipmentFormData, setShipmentFormData] = useState<ShipmentFormData>(defaultShipmentForm);
  const [trackingFormData, setTrackingFormData] = useState<Partial<Shipment>>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_transit' | 'delivered' | 'delayed' | 'on_hold'>('all');
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const shipmentsData = await getAllShipments();
      setShipments(shipmentsData);
      if (shipmentsData.length > 0) {
      toast.success('Data loaded successfully');
      }
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []); // Empty dependency array means this effect runs once on mount

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/administration_and_development/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleTestEmail = async () => {
    try {
      const testShipment: Shipment = {
        id: 'test-id',
        trackingNumber: 'TEST' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
        shipperName: 'Test Shipper',
        shipperEmail: 'globaltrackteam@gmail.com',
        shipperAddress: '123 Shipper St, Test City',
        shipperPhone: '+1 234-567-8900',
        receiverName: 'Test Receiver',
        receiverEmail: 'globaltrackteam@gmail.com',
        receiverAddress: '456 Receiver Ave, Test Town',
        receiverPhone: '+1 987-654-3210',
        origin: 'Test Origin City',
        destination: 'Test Destination City',
        carrier: 'Global Track Express',
        typeOfShipment: 'Express',
        shipmentMode: 'Air Shipping',
        packageCount: 2,
        product: 'Test Products',
        productQuantity: 5,
        paymentMode: 'Credit Card',
        totalFreight: 250.00,
        weight: 15.5,
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        departureTime: '09:00',
        pickupDate: new Date().toISOString().split('T')[0],
        pickupTime: '14:00',
        packages: [
          {
            quantity: 2,
            pieceType: 'Box',
            description: 'Fragile Electronics',
            length: 30,
            width: 20,
            height: 15,
            weight: 7.5
          },
          {
            quantity: 3,
            pieceType: 'Package',
            description: 'Office Supplies',
            length: 25,
            width: 25,
            height: 10,
            weight: 8
          }
        ],
        totalVolumetricWeight: 18.75,
        totalVolume: 0.0225,
        totalActualWeight: 15.5,
        shipmentHistory: [
          {
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString(),
            location: 'Test Origin City',
            status: 'pending',
            updatedBy: 'admin',
            remarks: 'Shipment created and ready for pickup'
          }
        ],
        status: 'pending',
        currentLocation: 'Test Origin City',
        comments: 'Test shipment for email template verification',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await Promise.all([
        sendShipperEmail(testShipment),
        sendReceiverEmail(testShipment)
      ]);
      
      toast.success('Test emails sent successfully!');
    } catch (error) {
      console.error('Email test failed:', error);
      toast.error('Failed to send test emails');
    }
  };

  // Shipment handlers
  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;
    
    try {
      setIsCreating(true);
      // Calculate totals
      const totalVolumetricWeight = shipmentFormData.packages.reduce((acc, pkg) => {
        return acc + (pkg.length * pkg.width * pkg.height * pkg.quantity) / 5000;
      }, 0);
      
      const totalVolume = shipmentFormData.packages.reduce((acc, pkg) => {
        return acc + (pkg.length * pkg.width * pkg.height * pkg.quantity) / 1000000;
      }, 0);
      
      const totalActualWeight = shipmentFormData.packages.reduce((acc, pkg) => {
        return acc + (pkg.weight * pkg.quantity);
      }, 0);

      const shipmentData = {
        ...shipmentFormData,
        currentLocation: shipmentFormData.origin,
        totalVolumetricWeight,
        totalVolume,
        totalActualWeight,
        shipmentHistory: [{
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString(),
          location: shipmentFormData.origin,
          status: shipmentFormData.status,
          updatedBy: 'admin',
          remarks: 'Shipment created'
        }]
      };

      await createShipment(shipmentData);
      setShowShipmentForm(false);
      loadData();
      toast.success('Shipment created successfully');
    } catch (error) {
      toast.error('Failed to create shipment');
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment || isUpdating) return;

    try {
      setIsUpdating(true);
      
      // If status or location has changed, update tracking info
      if (
        (trackingFormData.status && trackingFormData.status !== selectedShipment.status) ||
        (trackingFormData.currentLocation && trackingFormData.currentLocation !== selectedShipment.currentLocation)
      ) {
        await updateTrackingInfo(
          selectedShipment.id,
          trackingFormData.status || selectedShipment.status,
          trackingFormData.currentLocation || selectedShipment.currentLocation
        );
      }

      // Update other shipment details
      await updateShipment(selectedShipment.id, trackingFormData);
      
      setShowTrackingForm(false);
      loadData();
      toast.success('Shipment updated successfully');
    } catch (error) {
      toast.error('Failed to update shipment');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteShipment = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this shipment?') && !isDeleting) {
      try {
        setIsDeleting(id);
        await deleteShipment(id);
        loadData();
        toast.success('Shipment deleted successfully');
      } catch (error) {
        toast.error('Failed to delete shipment');
        console.error(error);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  // Reset form data when closing modals
  const resetShipmentForm = () => {
    setShipmentFormData(defaultShipmentForm);
    setShowShipmentForm(false);
  };

  const resetTrackingForm = () => {
    setTrackingFormData({});
    setShowTrackingForm(false);
    setSelectedShipment(null);
  };

  const filteredShipments = shipments.filter((shipment) =>
    searchTerm
      ? shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.shipperName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.status.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative bg-[#351c15] dark:bg-gray-800 py-16">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
            alt="Administration dashboard"
            className="w-full h-full object-cover opacity-30 dark:opacity-20"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Administration & Development
          </h1>
          <p className="mt-6 text-xl text-gray-300 dark:text-gray-200 max-w-3xl mx-auto">
            Manage shipments, users, and system settings with our comprehensive admin dashboard.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <AnimatedCard animation="slide" delay="0ms">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <div className="text-[#351c15] dark:text-[#ffbe03] mb-4">
                <Icon icon={FaEnvelope} size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Email Service</h3>
              <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                Test the email notification system for shipment updates.
              </p>
              <button
                onClick={handleTestEmail}
                className="mt-4 px-4 py-2 bg-[#351c15] dark:bg-[#ffbe03] text-white dark:text-gray-900 rounded-md hover:bg-[#4a2a1f] dark:hover:bg-[#e6a902]"
              >
                Test Email Service
              </button>
            </div>
          </AnimatedCard>

          <AnimatedCard animation="slide" delay="200ms">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <div className="text-[#351c15] dark:text-[#ffbe03] mb-4">
                <Icon icon={FaShieldAlt} size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">System Status</h3>
              <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                View and manage system security settings.
              </p>
              <button
                onClick={handleLogout}
                className="mt-4 px-4 py-2 bg-[#351c15] dark:bg-[#ffbe03] text-white dark:text-gray-900 rounded-md hover:bg-[#4a2a1f] dark:hover:bg-[#e6a902]"
              >
                Logout
              </button>
            </div>
          </AnimatedCard>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search shipments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-4 py-2 rounded-md border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-[#ffbe03] dark:focus:ring-[#ffbe03]`}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className={`px-4 py-2 rounded-md border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700 text-gray-100' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-[#ffbe03] dark:focus:ring-[#ffbe03]`}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="delayed">Delayed</option>
            <option value="on_hold">On Hold</option>
          </select>
          <button
            onClick={loadData}
            disabled={loading}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
              isDarkMode 
                ? 'text-gray-900 bg-[#ffbe03] hover:bg-[#e6a902] disabled:bg-gray-600' 
                : 'text-white bg-[#351c15] hover:bg-[#4a2a1f] disabled:bg-gray-400'
            }`}
          >
            {loading ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : (
              <FaSync className="mr-2" />
            )}
            Refresh
          </button>
        </div>

        {/* Shipments Table */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`}>Shipments</h2>
            <button
              onClick={() => setShowShipmentForm(true)}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                isDarkMode 
                  ? 'text-gray-900 bg-[#ffbe03] hover:bg-[#e6a902]' 
                  : 'text-white bg-[#351c15] hover:bg-[#4a2a1f]'
              }`}
            >
              <FaPlus className="mr-2" />
              New Shipment
            </button>
          </div>

          <div className={`overflow-x-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg`}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Tracking Number
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Origin
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Destination
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Expected Delivery
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Payment Mode
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {shipments
                  .filter((shipment) =>
                    searchTerm
                      ? shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        shipment.shipperName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        shipment.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        shipment.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        shipment.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        shipment.status.toLowerCase().includes(searchTerm.toLowerCase())
                      : true
                  )
                  .map((shipment) => (
                    <tr key={shipment.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        {shipment.trackingNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          shipment.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          shipment.status === 'in_transit' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                          shipment.status === 'delayed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          shipment.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}>
                          {shipment.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        {shipment.origin}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        {shipment.destination}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        {shipment.expectedDeliveryDate}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        {formatPaymentMode(shipment.paymentMode)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedShipment(shipment);
                            setShowTrackingForm(true);
                          }}
                          className={`text-[#351c15] dark:text-[#ffbe03] hover:text-[#4a2a1f] dark:hover:text-[#e6a902] mr-3`}
                        >
                          <FaMapMarkerAlt />
                        </button>
                        <button
                          onClick={() => handleDeleteShipment(shipment.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Shipment Form Modal */}
      {showShipmentForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-4xl my-8">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Create New Shipment</h2>
            </div>
            <div className="p-6 max-h-[calc(90vh-8rem)] overflow-y-auto">
              <form onSubmit={handleCreateShipment} className="space-y-6">
            {/* Shipper Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                    <h3 className="text-lg font-medium mb-2">Shipper Information</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shipper Name</label>
                    <input
                      type="text"
                          placeholder="Enter shipper's full name"
                      value={shipmentFormData.shipperName}
                      onChange={(e) => setShipmentFormData({ ...shipmentFormData, shipperName: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md"
                          title="Enter the full name of the person or company sending the shipment"
                      required
                    />
                  </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shipper Address</label>
                    <input
                      type="text"
                          placeholder="Enter complete shipping address"
                      value={shipmentFormData.shipperAddress}
                      onChange={(e) => setShipmentFormData({ ...shipmentFormData, shipperAddress: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md"
                          title="Enter the complete address where the shipment will be picked up"
                      required
                    />
                  </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shipper Phone</label>
                    <input
                      type="tel"
                          placeholder="Enter contact phone number"
                      value={shipmentFormData.shipperPhone}
                      onChange={(e) => setShipmentFormData({ ...shipmentFormData, shipperPhone: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md"
                          title="Enter a valid phone number for the shipper"
                      required
                    />
                  </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shipper Email</label>
                    <input
                      type="email"
                          placeholder="Enter email address"
                      value={shipmentFormData.shipperEmail}
                      onChange={(e) => setShipmentFormData({ ...shipmentFormData, shipperEmail: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md"
                          title="Enter a valid email address for shipment notifications"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                    <h3 className="text-lg font-medium mb-2">Receiver Information</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Name</label>
                    <input
                      type="text"
                          placeholder="Enter receiver's full name"
                      value={shipmentFormData.receiverName}
                      onChange={(e) => setShipmentFormData({ ...shipmentFormData, receiverName: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md"
                          title="Enter the full name of the person or company receiving the shipment"
                      required
                    />
                  </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Address</label>
                    <input
                      type="text"
                          placeholder="Enter complete delivery address"
                      value={shipmentFormData.receiverAddress}
                      onChange={(e) => setShipmentFormData({ ...shipmentFormData, receiverAddress: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md"
                          title="Enter the complete address where the shipment will be delivered"
                      required
                    />
                  </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Phone</label>
                    <input
                      type="tel"
                          placeholder="Enter contact phone number"
                      value={shipmentFormData.receiverPhone}
                      onChange={(e) => setShipmentFormData({ ...shipmentFormData, receiverPhone: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md"
                          title="Enter a valid phone number for the receiver"
                      required
                    />
                  </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Email</label>
                    <input
                      type="email"
                          placeholder="Enter email address"
                      value={shipmentFormData.receiverEmail}
                      onChange={(e) => setShipmentFormData({ ...shipmentFormData, receiverEmail: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md"
                          title="Enter a valid email address for delivery notifications"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Shipment Information */}
            <div>
                  <h3 className="text-lg font-medium mb-2">Shipment Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                  <input
                    type="text"
                    placeholder="Enter origin location"
                    value={shipmentFormData.origin}
                    onChange={(e) => setShipmentFormData({ ...shipmentFormData, origin: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        title="Enter the city or location where the shipment originates"
                    required
                  />
                </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                  <input
                    type="text"
                    placeholder="Enter destination location"
                    value={shipmentFormData.destination}
                    onChange={(e) => setShipmentFormData({ ...shipmentFormData, destination: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        title="Enter the city or location where the shipment will be delivered"
                    required
                  />
                </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
                      <input
                        type="text"
                        placeholder="Enter carrier name"
                    value={shipmentFormData.carrier}
                    onChange={(e) => setShipmentFormData({ ...shipmentFormData, carrier: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        title="Enter the name of the shipping carrier or company"
                    required
                  />
                </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type of Shipment</label>
                  <select
                    value={shipmentFormData.typeOfShipment}
                    onChange={(e) => setShipmentFormData({ ...shipmentFormData, typeOfShipment: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        title="Select the type of shipping service"
                    required
                  >
                        <option value="">Select Type</option>
                        <option value="standard">Standard</option>
                        <option value="express">Express</option>
                        <option value="economy">Economy</option>
                  </select>
                </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Shipment Mode</label>
                  <select
                    value={shipmentFormData.shipmentMode}
                    onChange={(e) => setShipmentFormData({ ...shipmentFormData, shipmentMode: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        title="Select the mode of transportation"
                    required
                  >
                        <option value="">Select Mode</option>
                    <option value="land_shipping">Land Shipping</option>
                    <option value="air_shipping">Air Shipping</option>
                    <option value="sea_shipping">Sea Shipping</option>
                  </select>
                </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <input
                    type="text"
                    placeholder="Enter product name"
                    value={shipmentFormData.product}
                    onChange={(e) => setShipmentFormData({ ...shipmentFormData, product: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        title="Enter the name or description of the product being shipped"
                    required
                  />
                </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Quantity</label>
                  <input
                    type="number"
                    placeholder="Enter quantity"
                    value={shipmentFormData.productQuantity}
                    onChange={(e) => setShipmentFormData({ ...shipmentFormData, productQuantity: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md"
                        title="Enter the total quantity of products being shipped"
                    required
                  />
                </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Freight</label>
                  <input
                        type="number"
                        placeholder="Enter total freight cost"
                        value={shipmentFormData.totalFreight}
                        onChange={(e) => setShipmentFormData({ ...shipmentFormData, totalFreight: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md"
                        title="Enter the total shipping cost"
                    required
                  />
                </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                  <input
                    type="number"
                        placeholder="Enter total weight"
                        value={shipmentFormData.weight}
                        onChange={(e) => setShipmentFormData({ ...shipmentFormData, weight: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md"
                        title="Enter the total weight of the shipment in kilograms"
                    required
                  />
                </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                      <input
                        type="text"
                        placeholder="Enter payment method"
                        value={shipmentFormData.paymentMode}
                        onChange={(e) => {
                          const value = e.target.value
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join(' ');
                          setShipmentFormData({ ...shipmentFormData, paymentMode: value });
                        }}
                        className="w-full px-3 py-2 border rounded-md"
                        title="Enter the preferred payment method"
                        required
                      />
                    </div>
              </div>
            </div>

            {/* Dates and Times */}
            <div>
                  <h3 className="text-lg font-medium mb-2">Dates and Times</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                        placeholder="Select expected delivery date"
                    value={shipmentFormData.expectedDeliveryDate}
                    onChange={(e) => setShipmentFormData({ ...shipmentFormData, expectedDeliveryDate: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        title="Select the expected date of delivery"
                    required
                  />
                </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
                  <input
                    type="time"
                        placeholder="Select departure time"
                    value={shipmentFormData.departureTime}
                    onChange={(e) => setShipmentFormData({ ...shipmentFormData, departureTime: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        title="Select the scheduled departure time"
                    required
                  />
                </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
                  <input
                    type="date"
                        placeholder="Select pickup date"
                    value={shipmentFormData.pickupDate}
                    onChange={(e) => setShipmentFormData({ ...shipmentFormData, pickupDate: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        title="Select the date when the shipment will be picked up"
                    required
                  />
                </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
                  <input
                    type="time"
                        placeholder="Select pickup time"
                    value={shipmentFormData.pickupTime}
                    onChange={(e) => setShipmentFormData({ ...shipmentFormData, pickupTime: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        title="Select the scheduled pickup time"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Package Details */}
            <div>
                  <h3 className="text-lg font-medium mb-2">Package Details</h3>
              {shipmentFormData.packages.map((pkg, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 border rounded-md">
                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={pkg.quantity}
                      onChange={(e) => {
                        const newPackages = [...shipmentFormData.packages];
                        newPackages[index].quantity = parseInt(e.target.value);
                        setShipmentFormData({ ...shipmentFormData, packages: newPackages });
                      }}
                          className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Piece Type</label>
                    <input
                      type="text"
                      placeholder="Piece Type"
                      value={pkg.pieceType}
                      onChange={(e) => {
                        const newPackages = [...shipmentFormData.packages];
                        newPackages[index].pieceType = e.target.value;
                        setShipmentFormData({ ...shipmentFormData, packages: newPackages });
                      }}
                          className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                        <input
                          type="number"
                          placeholder="Weight (kg)"
                          value={pkg.weight}
                          onChange={(e) => {
                            const newPackages = [...shipmentFormData.packages];
                            newPackages[index].weight = parseFloat(e.target.value);
                            setShipmentFormData({ ...shipmentFormData, packages: newPackages });
                          }}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          placeholder="Description"
                          value={pkg.description}
                          onChange={(e) => {
                            const newPackages = [...shipmentFormData.packages];
                            newPackages[index].description = e.target.value;
                            setShipmentFormData({ ...shipmentFormData, packages: newPackages });
                          }}
                          className="w-full px-3 py-2 border rounded-md min-h-[100px] resize-y"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Length (cm)</label>
                    <input
                      type="number"
                          placeholder="Length (cm)"
                      value={pkg.length}
                      onChange={(e) => {
                        const newPackages = [...shipmentFormData.packages];
                        newPackages[index].length = parseFloat(e.target.value);
                        setShipmentFormData({ ...shipmentFormData, packages: newPackages });
                      }}
                          className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Width (cm)</label>
                    <input
                      type="number"
                          placeholder="Width (cm)"
                      value={pkg.width}
                      onChange={(e) => {
                        const newPackages = [...shipmentFormData.packages];
                        newPackages[index].width = parseFloat(e.target.value);
                        setShipmentFormData({ ...shipmentFormData, packages: newPackages });
                      }}
                          className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                    <input
                      type="number"
                          placeholder="Height (cm)"
                      value={pkg.height}
                      onChange={(e) => {
                        const newPackages = [...shipmentFormData.packages];
                        newPackages[index].height = parseFloat(e.target.value);
                        setShipmentFormData({ ...shipmentFormData, packages: newPackages });
                      }}
                          className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setShipmentFormData({
                    ...shipmentFormData,
                    packages: [
                      ...shipmentFormData.packages,
                      {
                        quantity: 1,
                            pieceType: '',
                        description: '',
                        length: 0,
                        width: 0,
                        height: 0,
                        weight: 0
                      }
                    ]
                  });
                }}
                    className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Add Package
              </button>
            </div>

                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetShipmentForm}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
              <button
                type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 inline-flex items-center"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <FaSpinner className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        Creating...
                      </>
                    ) : (
                      'Create'
                    )}
              </button>
            </div>
          </form>
        </div>
                      </div>
        </div>
      )}

      {/* Tracking Form Modal */}
      {showTrackingForm && selectedShipment && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-4xl my-8">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Edit Shipment Details</h2>
                </div>
            <div className="p-6 max-h-[calc(90vh-8rem)] overflow-y-auto">
              <form onSubmit={handleUpdateTracking} className="space-y-6">
                {/* Shipper Information */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Shipper Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Shipper Name</label>
                      <input
                        type="text"
                        value={trackingFormData.shipperName || selectedShipment.shipperName}
                        onChange={(e) => setTrackingFormData({ ...trackingFormData, shipperName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
              </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Shipper Address</label>
                      <input
                        type="text"
                        value={trackingFormData.shipperAddress || selectedShipment.shipperAddress}
                        onChange={(e) => setTrackingFormData({ ...trackingFormData, shipperAddress: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
            </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Shipper Phone</label>
                      <input
                        type="tel"
                        value={trackingFormData.shipperPhone || selectedShipment.shipperPhone}
                        onChange={(e) => setTrackingFormData({ ...trackingFormData, shipperPhone: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Shipper Email</label>
                      <input
                        type="email"
                        value={trackingFormData.shipperEmail || selectedShipment.shipperEmail}
                        onChange={(e) => setTrackingFormData({ ...trackingFormData, shipperEmail: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
          </div>
        </div>
      </div>

                {/* Receiver Information */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Receiver Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Name</label>
                <input
                  type="text"
                        value={trackingFormData.receiverName || selectedShipment.receiverName}
                        onChange={(e) => setTrackingFormData({ ...trackingFormData, receiverName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                  required
                />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Address</label>
                      <input
                        type="text"
                        value={trackingFormData.receiverAddress || selectedShipment.receiverAddress}
                        onChange={(e) => setTrackingFormData({ ...trackingFormData, receiverAddress: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Phone</label>
                      <input
                        type="tel"
                        value={trackingFormData.receiverPhone || selectedShipment.receiverPhone}
                        onChange={(e) => setTrackingFormData({ ...trackingFormData, receiverPhone: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Receiver Email</label>
                <input
                  type="email"
                        value={trackingFormData.receiverEmail || selectedShipment.receiverEmail}
                        onChange={(e) => setTrackingFormData({ ...trackingFormData, receiverEmail: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                  required
                />
                    </div>
                  </div>
                </div>

                {/* Shipment Information */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Shipment Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                      <input
                        type="text"
                        value={trackingFormData.origin || selectedShipment.origin}
                        onChange={(e) => setTrackingFormData({ ...trackingFormData, origin: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                      <input
                        type="text"
                        value={trackingFormData.destination || selectedShipment.destination}
                        onChange={(e) => setTrackingFormData({ ...trackingFormData, destination: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
                      <input
                        type="text"
                        value={trackingFormData.carrier || selectedShipment.carrier}
                        onChange={(e) => setTrackingFormData({ ...trackingFormData, carrier: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type of Shipment</label>
                <select
                        value={trackingFormData.typeOfShipment || selectedShipment.typeOfShipment}
                        onChange={(e) => setTrackingFormData({ ...trackingFormData, typeOfShipment: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                  required
                >
                        <option value="">Select Type</option>
                        <option value="standard">Standard</option>
                        <option value="express">Express</option>
                        <option value="economy">Economy</option>
                </select>
              </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Shipment Mode</label>
                      <select
                        value={trackingFormData.shipmentMode || selectedShipment.shipmentMode}
                        onChange={(e) => setTrackingFormData({ ...trackingFormData, shipmentMode: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      >
                        <option value="">Select Mode</option>
                        <option value="land_shipping">Land Shipping</option>
                        <option value="air_shipping">Air Shipping</option>
                        <option value="sea_shipping">Sea Shipping</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                      <input
                        type="text"
                        value={trackingFormData.product || selectedShipment.product}
                        onChange={(e) => setTrackingFormData({ ...trackingFormData, product: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Quantity</label>
                      <input
                        type="number"
                        value={trackingFormData.productQuantity || selectedShipment.productQuantity}
                        onChange={(e) => setTrackingFormData({ ...trackingFormData, productQuantity: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Freight</label>
                      <input
                        type="number"
                        value={trackingFormData.totalFreight || selectedShipment.totalFreight}
                        onChange={(e) => setTrackingFormData({ ...trackingFormData, totalFreight: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                      <input
                        type="number"
                        value={trackingFormData.weight || selectedShipment.weight}
                        onChange={(e) => setTrackingFormData({ ...trackingFormData, weight: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                      <input
                        type="text"
                        placeholder="Enter payment method"
                        value={trackingFormData.paymentMode || selectedShipment.paymentMode}
                        onChange={(e) => {
                          const value = e.target.value
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join(' ');
                          setTrackingFormData({ ...trackingFormData, paymentMode: value });
                        }}
                        className="w-full px-3 py-2 border rounded-md"
                        title="Enter the preferred payment method"
                        required
                      />
                    </div>
          </div>
        </div>

                {/* Dates and Times */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Dates and Times</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={trackingFormData.status || selectedShipment.status}
                        onChange={(e) => setTrackingFormData({ ...trackingFormData, status: e.target.value as Shipment['status'] })}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      >
                        <option value="pending">Pending</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                        <option value="delayed">Delayed</option>
                        <option value="on_hold">On Hold</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
                      <input
                        type="text"
                        value={trackingFormData.currentLocation || selectedShipment.currentLocation}
                        onChange={(e) => setTrackingFormData({ ...trackingFormData, currentLocation: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</label>
                      <input
                        type="date"
                        value={trackingFormData.expectedDeliveryDate || selectedShipment.expectedDeliveryDate}
                        onChange={(e) => setTrackingFormData({ ...trackingFormData, expectedDeliveryDate: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
                      <input
                        type="time"
                        value={trackingFormData.departureTime || selectedShipment.departureTime}
                        onChange={(e) => setTrackingFormData({ ...trackingFormData, departureTime: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
                      <input
                        type="date"
                        value={trackingFormData.pickupDate || selectedShipment.pickupDate}
                        onChange={(e) => setTrackingFormData({ ...trackingFormData, pickupDate: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
                      <input
                        type="time"
                        value={trackingFormData.pickupTime || selectedShipment.pickupTime}
                        onChange={(e) => setTrackingFormData({ ...trackingFormData, pickupTime: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Package Details */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Package Details</h3>
                  {(trackingFormData.packages || selectedShipment.packages).map((pkg, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 border rounded-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          value={pkg.quantity}
                          onChange={(e) => {
                            const newPackages = [...(trackingFormData.packages || selectedShipment.packages)];
                            newPackages[index].quantity = parseInt(e.target.value);
                            setTrackingFormData({ ...trackingFormData, packages: newPackages });
                          }}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Piece Type</label>
                        <input
                          type="text"
                          value={pkg.pieceType}
                          onChange={(e) => {
                            const newPackages = [...(trackingFormData.packages || selectedShipment.packages)];
                            newPackages[index].pieceType = e.target.value;
                            setTrackingFormData({ ...trackingFormData, packages: newPackages });
                          }}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                        <input
                          type="number"
                          value={pkg.weight}
                          onChange={(e) => {
                            const newPackages = [...(trackingFormData.packages || selectedShipment.packages)];
                            newPackages[index].weight = parseFloat(e.target.value);
                            setTrackingFormData({ ...trackingFormData, packages: newPackages });
                          }}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          placeholder="Description"
                          value={pkg.description}
                          onChange={(e) => {
                            const newPackages = [...(trackingFormData.packages || selectedShipment.packages)];
                            newPackages[index].description = e.target.value;
                            setTrackingFormData({ ...trackingFormData, packages: newPackages });
                          }}
                          className="w-full px-3 py-2 border rounded-md min-h-[100px] resize-y"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Length (cm)</label>
                        <input
                          type="number"
                          value={pkg.length}
                          onChange={(e) => {
                            const newPackages = [...(trackingFormData.packages || selectedShipment.packages)];
                            newPackages[index].length = parseFloat(e.target.value);
                            setTrackingFormData({ ...trackingFormData, packages: newPackages });
                          }}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Width (cm)</label>
                        <input
                          type="number"
                          value={pkg.width}
                          onChange={(e) => {
                            const newPackages = [...(trackingFormData.packages || selectedShipment.packages)];
                            newPackages[index].width = parseFloat(e.target.value);
                            setTrackingFormData({ ...trackingFormData, packages: newPackages });
                          }}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                        <input
                          type="number"
                          value={pkg.height}
                          onChange={(e) => {
                            const newPackages = [...(trackingFormData.packages || selectedShipment.packages)];
                            newPackages[index].height = parseFloat(e.target.value);
                            setTrackingFormData({ ...trackingFormData, packages: newPackages });
                          }}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetTrackingForm}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 inline-flex items-center"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <FaSpinner className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        Updating...
                      </>
                    ) : (
                      'Update'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdministrationAndDevelopment;
