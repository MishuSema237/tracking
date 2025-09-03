import React, { useState, useRef } from 'react';
import { getShipmentByTracking, Shipment } from '../services/shipmentService';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-toastify';
import {
  FaSearch,
  FaBox,
  FaTruck,
  FaWarehouse,
  FaShippingFast,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaBoxOpen,
  FaWeightHanging,
  FaRuler,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPauseCircle,
  FaGlobe,
  FaUsers,
  FaChartLine,
  FaShieldAlt,
  FaPlane,
  FaShip,
  FaTruckLoading,
  FaHandshake,
  FaHeadset,
  FaCreditCard,
  FaDollarSign,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaSpinner,
  FaCheck,
  FaCopy,
  FaArrowRight,
} from 'react-icons/fa';
import AnimatedCard from '../components/animations/AnimatedCard';
import ShipmentMap from '../components/ShipmentMap';

const Track: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTrackingForm, setShowTrackingForm] = useState(true);
  const [copied, setCopied] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const formatText = (text: string) => {
    return text
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Tracking number copied to clipboard!');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }
    setIsLoading(true);
    setError(null);
    setShipment(null);

    try {
      const shipmentData = await getShipmentByTracking(trackingNumber);
      setShipment(shipmentData);
      setShowTrackingForm(false);
    } catch (err) {
      setError('Shipment not found. Please check your tracking number and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    scrollToTop();
  };

  const handleFreightModeClick = (mode: string) => {
    // Find the element with the matching freight mode
    const element = document.getElementById(`freight-mode-${mode.toLowerCase().replace(/\s+/g, '-')}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      // Add highlight effect
      element.classList.add('animate-pulse');
      setTimeout(() => {
        element.classList.remove('animate-pulse');
      }, 2000);
    }
  };

  const getStatusColor = (status: string) => {
    if (isDarkMode) {
      switch (status.toLowerCase()) {
        case 'delivered':
          return 'text-green-400';
        case 'in_transit':
          return 'text-blue-400';
        case 'delayed':
          return 'text-red-400';
        case 'on_hold':
          return 'text-yellow-400';
        default:
          return 'text-gray-400';
      }
    } else {
      switch (status.toLowerCase()) {
        case 'delivered':
          return 'text-green-600';
        case 'in_transit':
          return 'text-blue-600';
        case 'delayed':
          return 'text-red-600';
        case 'on_hold':
          return 'text-yellow-600';
        default:
          return 'text-gray-600';
      }
    }
  };

  const getStatusIcon = (status: string) => {
    const colorClass = isDarkMode ? {
      delivered: 'text-green-400',
      in_transit: 'text-blue-400',
      delayed: 'text-red-400',
      on_hold: 'text-yellow-400',
      default: 'text-gray-400'
    } : {
      delivered: 'text-green-600',
      in_transit: 'text-blue-600',
      delayed: 'text-red-600',
      on_hold: 'text-yellow-600',
      default: 'text-gray-600'
    };

    switch (status.toLowerCase()) {
      case 'delivered':
        return <FaCheckCircle className={`text-2xl ${colorClass.delivered}`} />;
      case 'in_transit':
        return <FaTruck className={`text-2xl ${colorClass.in_transit}`} />;
      case 'delayed':
        return <FaExclamationTriangle className={`text-2xl ${colorClass.delayed}`} />;
      case 'on_hold':
        return <FaPauseCircle className={`text-2xl ${colorClass.on_hold}`} />;
      default:
        return <FaBox className={`text-2xl ${colorClass.default}`} />;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section with Tracking */}
      <div className="bg-[#351c15] dark:bg-[#1a0e0a] text-white py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">Track Your Shipment</h1>
            <p className="text-lg sm:text-xl mb-8 text-gray-300">Enter your tracking number to get real-time updates</p>
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className={`w-full px-6 py-4 rounded-lg text-lg ${
                      isDarkMode 
                        ? 'bg-gray-800 text-gray-100 placeholder-gray-400 border-gray-700' 
                        : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300'
                    } focus:ring-2 focus:ring-[#ffbe03] focus:border-[#ffbe03] shadow-lg`}
                  />
                  <FaSearch className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-xl`} />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-8 py-4 font-semibold rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-all duration-300 ${
                    isDarkMode
                      ? 'bg-[#ffbe03] text-gray-900 hover:bg-[#e6a902] focus:ring-[#ffbe03] focus:ring-offset-gray-900'
                      : 'bg-white text-[#351c15] hover:bg-gray-100 focus:ring-[#351c15] focus:ring-offset-[#351c15]'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <FaSpinner className="animate-spin" />
                      <span>Tracking...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FaSearch />
                      <span>Track</span>
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {shipment ? (
        <div className="max-w-7xl mx-auto p-4 sm:p-6" ref={resultsRef}>
          {/* Tracking Number Display */}
              <div className={`rounded-lg p-6 mb-6 ${
                isDarkMode 
              ? 'bg-slate-800 shadow-lg shadow-slate-900/20' 
                  : 'bg-white shadow-lg'
              }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                <h2 className={`text-sm uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Tracking Number</h2>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{shipment.trackingNumber}</span>
                  <button
                    onClick={handleCopyTracking}
                    className={`p-2 rounded-full transition-colors duration-200 ${
                      isDarkMode 
                        ? 'hover:bg-slate-700 text-gray-400 hover:text-white' 
                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {copied ? <FaCheck className="text-green-500" /> : <FaCopy />}
                  </button>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full ${
                shipment.status === 'delivered' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : shipment.status === 'in_transit'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  : shipment.status === 'delayed'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  : shipment.status === 'on_hold'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
              }`}>
                <span className="font-semibold">{formatText(shipment.status)}</span>
              </div>
                  </div>
              </div>

          {/* Shipment Status Timeline */}
          <div className={`rounded-lg p-6 mb-6 ${
            isDarkMode 
              ? 'bg-slate-800 shadow-lg shadow-slate-900/20' 
              : 'bg-white shadow-lg'
          }`}>
            <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Shipment Progress</h2>
                <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                    {shipment.shipmentHistory?.map((history, index) => {
                      let statusColor;
                let bgColor;
                      let StatusIcon;

                switch (history.status) {
                  case 'delivered':
                    statusColor = isDarkMode ? 'text-green-400' : 'text-green-600';
                    bgColor = isDarkMode ? 'bg-green-400/10' : 'bg-green-100';
                    StatusIcon = FaCheckCircle;
                          break;
                        case 'in_transit':
                          statusColor = isDarkMode ? 'text-blue-400' : 'text-blue-600';
                          bgColor = isDarkMode ? 'bg-blue-400/10' : 'bg-blue-100';
                          StatusIcon = FaTruck;
                          break;
                        case 'delayed':
                          statusColor = isDarkMode ? 'text-red-400' : 'text-red-600';
                          bgColor = isDarkMode ? 'bg-red-400/10' : 'bg-red-100';
                          StatusIcon = FaExclamationTriangle;
                          break;
                        case 'on_hold':
                          statusColor = isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
                          bgColor = isDarkMode ? 'bg-yellow-400/10' : 'bg-yellow-100';
                          StatusIcon = FaPauseCircle;
                          break;
                        default:
                          statusColor = isDarkMode ? 'text-gray-400' : 'text-gray-600';
                          bgColor = isDarkMode ? 'bg-gray-400/10' : 'bg-gray-100';
                          StatusIcon = FaBox;
                      }

                      return (
                  <div key={index} className="relative pl-8 mb-6 last:mb-0">
                    <div className={`absolute left-0 -ml-[13px] mt-[25px] p-1.5 rounded-full ${bgColor}`}>
                      <StatusIcon className={`text-base ${statusColor}`} />
                          </div>
                          <div className={`p-4 rounded-lg ${
                            isDarkMode 
                        ? 'bg-slate-700 shadow-md shadow-slate-900/10' 
                              : 'bg-gray-50 shadow-sm'
                          }`}>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-6">
                              <div>
                                <div className={`font-bold text-sm uppercase mb-1 ${statusColor}`}>
                            {history.status.toUpperCase().replace(/_/g, ' ')}
                                </div>
                          <div className="text-sm text-gray-500">
                                  {history.date} {history.time}
                                </div>
                              </div>
                        <div className="text-left sm:text-right">
                                <div className={`font-bold text-sm uppercase ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  {history.location}
                                </div>
                          <div className="text-sm text-gray-500">
                                  {history.remarks}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
          </div>

          {/* Shipment Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Origin & Destination */}
            <div className={`rounded-lg p-6 ${
              isDarkMode 
                ? 'bg-slate-800 shadow-lg shadow-slate-900/20' 
                : 'bg-white shadow-lg'
            }`}>
              <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Route Information</h2>
              <div className="space-y-6">
                <div>
                  <div className={`text-sm uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Origin</div>
                  <div className={`flex items-center gap-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <FaMapMarkerAlt className={`text-lg ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                    <span className="font-medium">{shipment.origin}</span>
                  </div>
                </div>
                <div>
                  <div className={`text-sm uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Destination</div>
                  <div className={`flex items-center gap-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <FaMapMarkerAlt className={`text-lg ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                    <span className="font-medium">{shipment.destination}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Package Summary */}
            <div className={`rounded-lg p-6 ${
              isDarkMode 
                ? 'bg-slate-800 shadow-lg shadow-slate-900/20' 
                : 'bg-white shadow-lg'
            }`}>
              <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Package Summary</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`text-sm uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Packages</div>
                  <div className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {shipment.packages.length}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className={`text-sm uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Weight</div>
                  <div className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {shipment.packages.reduce((total, pkg) => total + pkg.weight, 0)} KG
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Shipment Information */}
          <div className={`rounded-lg p-6 mb-6 ${
            isDarkMode 
              ? 'bg-slate-800 shadow-lg shadow-slate-900/20' 
              : 'bg-white shadow-lg'
          }`}>
            <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Shipment Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <div className={`text-sm uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Carrier</div>
                <div className={`flex items-center gap-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <FaTruck className={`text-lg ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                  <span className="font-medium">{shipment.carrier}</span>
                </div>
              </div>
              <div>
                <div className={`text-sm uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Type of Shipment</div>
                <div className={`flex items-center gap-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <FaBox className={`text-lg ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                  <span className="font-medium capitalize">{shipment.typeOfShipment.replace(/_/g, ' ')}</span>
                </div>
              </div>
              <div>
                <div className={`text-sm uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Shipment Mode</div>
                <div className={`flex items-center gap-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {shipment.shipmentMode.toLowerCase().includes('sea') ? (
                    <FaShip className={`text-lg ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                  ) : shipment.shipmentMode.toLowerCase().includes('air') ? (
                    <FaPlane className={`text-lg ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                  ) : (
                    <FaTruck className={`text-lg ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                  )}
                  <span className="font-medium capitalize">{shipment.shipmentMode.replace(/_/g, ' ')}</span>
                </div>
              </div>
              <div>
                <div className={`text-sm uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Payment Mode</div>
                <div className={`flex items-center gap-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <FaCreditCard className={`text-lg ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                  <span className="font-medium capitalize">{shipment.paymentMode.replace(/_/g, ' ')}</span>
                </div>
              </div>
              <div>
                <div className={`text-sm uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Freight</div>
                <div className={`flex items-center gap-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <FaDollarSign className={`text-lg ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                  <span className="font-medium">${shipment.totalFreight}</span>
                </div>
              </div>
              <div>
                <div className={`text-sm uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Expected Delivery</div>
                <div className={`flex items-center gap-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <FaCalendarAlt className={`text-lg ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                  <span className="font-medium">{shipment.expectedDeliveryDate}</span>
                </div>
              </div>
              <div>
                <div className={`text-sm uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pick-up Date</div>
                <div className={`flex items-center gap-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <FaCalendarAlt className={`text-lg ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                  <span className="font-medium">{shipment.pickupDate}</span>
                </div>
              </div>
              <div>
                <div className={`text-sm uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pick-up Time</div>
                <div className={`flex items-center gap-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <FaClock className={`text-lg ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                  <span className="font-medium">{shipment.pickupTime}</span>
                </div>
              </div>
              <div>
                <div className={`text-sm uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Departure Time</div>
                <div className={`flex items-center gap-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <FaClock className={`text-lg ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                  <span className="font-medium">{shipment.departureTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Package Details Table */}
          <div className={`rounded-lg p-6 mb-6 ${
            isDarkMode 
              ? 'bg-slate-800 shadow-lg shadow-slate-900/20' 
              : 'bg-white shadow-lg'
          }`}>
            <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Package Details</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className={`py-3 px-4 text-left text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Qty.</th>
                    <th className={`py-3 px-4 text-left text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Piece Type</th>
                    <th className={`py-3 px-4 text-left text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</th>
                    <th className={`py-3 px-4 text-left text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Length(cm)</th>
                    <th className={`py-3 px-4 text-left text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Width(cm)</th>
                    <th className={`py-3 px-4 text-left text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Height(cm)</th>
                    <th className={`py-3 px-4 text-left text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Weight (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {shipment.packages.map((pkg, index) => (
                    <tr key={index} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} ${index % 2 === 0 ? (isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50') : ''}`}>
                      <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{pkg.quantity}</td>
                      <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{pkg.pieceType}</td>
                      <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{pkg.description}</td>
                      <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{pkg.length}</td>
                      <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{pkg.width}</td>
                      <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{pkg.height}</td>
                      <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{pkg.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
                </div>
              </div>

              {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shipper Information */}
            <div className={`rounded-lg p-6 ${
              isDarkMode 
                ? 'bg-slate-800 shadow-lg shadow-slate-900/20' 
                : 'bg-white shadow-lg'
            }`}>
              <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Shipper Information</h2>
              <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <div className="flex items-center gap-3">
                  <FaUser className={`text-lg ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                  <span className="font-medium">{shipment.shipperName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaMapMarkerAlt className={`text-lg ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                  <span className="font-medium">{shipment.shipperAddress}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaPhone className={`text-lg ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                  <span className="font-medium">{shipment.shipperPhone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaEnvelope className={`text-lg ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                  <span className="font-medium">{shipment.shipperEmail}</span>
                </div>
              </div>
            </div>

            {/* Receiver Information */}
            <div className={`rounded-lg p-6 ${
              isDarkMode 
                ? 'bg-slate-800 shadow-lg shadow-slate-900/20' 
                : 'bg-white shadow-lg'
            }`}>
              <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Receiver Information</h2>
              <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <div className="flex items-center gap-3">
                  <FaUser className={`text-lg ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                  <span className="font-medium">{shipment.receiverName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaMapMarkerAlt className={`text-lg ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                  <span className="font-medium">{shipment.receiverAddress}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaPhone className={`text-lg ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                  <span className="font-medium">{shipment.receiverPhone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaEnvelope className={`text-lg ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                  <span className="font-medium">{shipment.receiverEmail}</span>
                </div>
              </div>
            </div>
                      </div>
                      
                      {/* Shipment Map */}
                      <div className="mt-6">
                        <ShipmentMap shipment={shipment} isDarkMode={isDarkMode} />
                      </div>
                      </div>
      ) : (
        <>
          {/* Features Section */}
          <div className="py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className={`text-3xl sm:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Why Choose Our Tracking Service?
                </h2>
                <p className={`mt-4 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Experience seamless shipment tracking with our state-of-the-art system
                </p>
                      </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Real-time Tracking */}
                <AnimatedCard>
                  <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                    <div className={`w-12 h-12 rounded-full ${isDarkMode ? 'bg-[#ffbe03]/10' : 'bg-[#351c15]/10'} flex items-center justify-center mb-4`}>
                      <FaMapMarkerAlt className={`text-2xl ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                    </div>
                    <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Real-time Tracking
                    </h3>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Monitor your shipments in real-time with accurate location updates and estimated delivery times.
                    </p>
                  </div>
                </AnimatedCard>

                {/* Global Coverage */}
                <AnimatedCard>
                  <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                    <div className={`w-12 h-12 rounded-full ${isDarkMode ? 'bg-[#ffbe03]/10' : 'bg-[#351c15]/10'} flex items-center justify-center mb-4`}>
                      <FaPlane className={`text-2xl ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                      </div>
                    <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Global Coverage
                    </h3>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Track shipments worldwide with our extensive network of carriers and partners.
                    </p>
                      </div>
                </AnimatedCard>

                {/* Detailed Updates */}
                <AnimatedCard>
                  <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                    <div className={`w-12 h-12 rounded-full ${isDarkMode ? 'bg-[#ffbe03]/10' : 'bg-[#351c15]/10'} flex items-center justify-center mb-4`}>
                      <FaBox className={`text-2xl ${isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'}`} />
                    </div>
                    <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Detailed Updates
                    </h3>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Get comprehensive shipment details including status, location, and delivery updates.
                    </p>
                  </div>
                </AnimatedCard>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className={`py-12 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className={`text-3xl sm:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  How It Works
                </h2>
                <p className={`mt-4 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Track your shipment in three simple steps
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Step 1 */}
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full ${isDarkMode ? 'bg-[#ffbe03]' : 'bg-[#351c15]'} flex items-center justify-center mx-auto mb-4`}>
                    <span className="text-2xl font-bold text-white">1</span>
                  </div>
                  <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Enter Tracking Number
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Input your tracking number in the search box above
                  </p>
                </div>

                {/* Step 2 */}
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full ${isDarkMode ? 'bg-[#ffbe03]' : 'bg-[#351c15]'} flex items-center justify-center mx-auto mb-4`}>
                    <span className="text-2xl font-bold text-white">2</span>
                  </div>
                  <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Get Real-time Updates
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    View detailed shipment information and status
                  </p>
                </div>

                {/* Step 3 */}
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full ${isDarkMode ? 'bg-[#ffbe03]' : 'bg-[#351c15]'} flex items-center justify-center mx-auto mb-4`}>
                    <span className="text-2xl font-bold text-white">3</span>
                  </div>
                  <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Track Delivery Progress
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Monitor your shipment's journey until delivery
                  </p>
                </div>
              </div>
            </div>
          </div>

      {/* About Section */}
          <div className="py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className={`text-3xl sm:text-4xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Your Trusted Shipping Partner
            </h2>
                  <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    We provide reliable and efficient shipping solutions worldwide. Our advanced tracking system ensures you always know where your shipment is and when it will arrive.
                  </p>
                  <ul className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <li className="flex items-center gap-3">
                      <FaCheckCircle className={isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'} />
                      <span>24/7 shipment tracking</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <FaCheckCircle className={isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'} />
                      <span>Global shipping network</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <FaCheckCircle className={isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'} />
                      <span>Professional support team</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <FaCheckCircle className={isDarkMode ? 'text-[#ffbe03]' : 'text-[#351c15]'} />
                      <span>Secure and reliable service</span>
                    </li>
                  </ul>
                </div>
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
                    alt="Shipping operations"
                    className="rounded-xl shadow-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Track; 
