// src/pages/PaymentMethodsPage.jsx

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { 
  useGetPaymentMethodsQuery, 
  useAddPaymentMethodMutation, 
  useDeletePaymentMethodMutation 
} from '@/features/api/paymentMethodApi';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Plus, Trash2, CreditCard, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PaymentMethodsPage = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useGetPaymentMethodsQuery();
  const [addPaymentMethod, { isLoading: isAdding }] = useAddPaymentMethodMutation();
  const [deletePaymentMethod, { isLoading: isDeleting }] = useDeletePaymentMethodMutation();

  const methods = data?.methods || [];

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [methodType, setMethodType] = useState('esewa'); // 'esewa' or 'card'
  const [esewaId, setEsewaId] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState(''); // mockup

  const handleAddMethod = async (e) => {
    e.preventDefault();
    try {
      let payload = { type: methodType };
      if (methodType === 'esewa') {
        if (!esewaId) {
          toast.error("Please enter your eSewa ID");
          return;
        }
        payload.esewaId = esewaId;
      } else {
        if (!cardholderName || !cardNumber || !expiryDate) {
          toast.error("Please fill in all card details");
          return;
        }
        // Basic card validation mockup
        if (cardNumber.replace(/\s+/g, '').length < 12) {
          toast.error("Invalid card number length");
          return;
        }
        payload.cardholderName = cardholderName;
        payload.cardNumber = cardNumber;
        payload.expiryDate = expiryDate;
      }

      await addPaymentMethod(payload).unwrap();
      toast.success("Payment method saved successfully!");
      setShowAddForm(false);
      resetForm();
    } catch (err) {
      toast.error(err.data?.message || "Failed to save payment method");
    }
  };

  const handleDeleteMethod = async (id) => {
    try {
      await deletePaymentMethod(id).unwrap();
      toast.success("Payment method deleted");
    } catch (err) {
      toast.error("Failed to delete payment method");
    }
  };

  const resetForm = () => {
    setEsewaId('');
    setCardholderName('');
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
  };

  // Card formatting
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    let formattedValue = value.replace(/(.{4})/g, '$1 ').trim();
    if (formattedValue.length <= 19) {
      setCardNumber(formattedValue);
    }
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    if (value.length <= 5) {
      setExpiryDate(value);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 min-h-screen text-left font-sans">
      <div className="flex justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1c1d1f] tracking-tight">Payment Methods</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your saved credit cards, eSewa IDs, and digital wallets.</p>
        </div>
        {!showAddForm && (
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-[#1c1d1f] text-white hover:bg-slate-800 font-bold text-sm h-11 px-5 rounded-none flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Method
          </Button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-white border border-[#d1d7dc] p-6 mb-8 shadow-sm animate-in fade-in duration-200">
          <h3 className="font-bold text-lg text-[#1c1d1f] mb-4">Add New Payment Method</h3>
          
          {/* Method Selector */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => { setMethodType('esewa'); resetForm(); }}
              className={`flex-1 py-3 px-4 border text-center font-bold text-sm transition-all ${
                methodType === 'esewa' 
                  ? 'border-purple-650 bg-purple-50/50 text-[#5624d0]' 
                  : 'border-slate-250 text-slate-600 hover:bg-slate-50'
              }`}
            >
              eSewa ID
            </button>
            <button
              onClick={() => { setMethodType('card'); resetForm(); }}
              className={`flex-1 py-3 px-4 border text-center font-bold text-sm transition-all ${
                methodType === 'card' 
                  ? 'border-purple-650 bg-purple-50/50 text-[#5624d0]' 
                  : 'border-slate-250 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Credit / Debit Card
            </button>
          </div>

          <form onSubmit={handleAddMethod} className="space-y-4">
            {methodType === 'esewa' ? (
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">eSewa ID (Phone Number or Email)</label>
                <input 
                  type="text" 
                  value={esewaId}
                  onChange={(e) => setEsewaId(e.target.value)}
                  placeholder="e.g. 9841234567 or user@example.com"
                  className="w-full border border-slate-350 p-2.5 text-sm focus:border-[#1c1d1f] focus:outline-none"
                  required
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Cardholder Name</label>
                  <input 
                    type="text" 
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full border border-slate-350 p-2.5 text-sm focus:border-[#1c1d1f] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Card Number</label>
                  <input 
                    type="text" 
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="4111 2222 3333 4444"
                    className="w-full border border-slate-350 p-2.5 text-sm focus:border-[#1c1d1f] focus:outline-none font-mono"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Expiry Date (MM/YY)</label>
                    <input 
                      type="text" 
                      value={expiryDate}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      className="w-full border border-slate-350 p-2.5 text-sm focus:border-[#1c1d1f] focus:outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">CVV / Security Code</label>
                    <input 
                      type="password" 
                      maxLength="3"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                      placeholder="•••"
                      className="w-full border border-slate-350 p-2.5 text-sm focus:border-[#1c1d1f] focus:outline-none font-mono"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-[#d1d7dc] mt-6">
              <Button 
                type="button"
                variant="outline"
                onClick={() => { setShowAddForm(false); resetForm(); }}
                className="border-slate-300 hover:bg-slate-50 font-bold text-slate-700 h-10 px-5 rounded-none"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isAdding}
                className="bg-[#1c1d1f] text-white hover:bg-slate-800 font-bold text-sm h-10 px-5 rounded-none"
              >
                {isAdding ? "Saving..." : "Save Method"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Saved Methods List */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-[#1c1d1f] mb-3">Your Saved Payment Methods</h3>

        {methods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {methods.map((method) => (
              <div 
                key={method._id} 
                className="bg-white border border-[#d1d7dc] p-5 flex justify-between items-start hover:shadow-md transition-shadow relative"
              >
                <div className="flex gap-4">
                  {/* Left Icon */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-none shrink-0 flex items-center justify-center h-12 w-16">
                    {method.type === 'esewa' ? (
                      <span className="font-extrabold text-green-600 text-xs tracking-tight">eSewa</span>
                    ) : (
                      <CreditCard className="w-6 h-6 text-slate-650" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1c1d1f]">
                      {method.type === 'esewa' ? 'eSewa Account' : `${method.cardType} Card`}
                    </p>
                    <p className="text-xs text-slate-500 font-mono mt-1 select-all">
                      {method.type === 'esewa' ? method.esewaId : method.cardNumber}
                    </p>
                    {method.type === 'card' && (
                      <p className="text-[11px] text-slate-400 mt-1 font-semibold">
                        Expires: {method.expiryDate} | Name: {method.cardholderName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Delete Action */}
                <button
                  onClick={() => handleDeleteMethod(method._id)}
                  disabled={isDeleting}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-full focus:outline-none shrink-0"
                  aria-label="Delete payment method"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-white border border-[#d1d7dc] text-center px-4 shadow-sm">
            <CreditCard className="w-12 h-12 text-slate-350 mb-3" />
            <h4 className="text-base font-bold text-slate-800 mb-0.5">No Payment Methods Saved</h4>
            <p className="text-xs text-slate-500 font-medium max-w-sm mb-4">
              Add credit cards or eSewa accounts for a faster checkout experience.
            </p>
            <Button 
              onClick={() => setShowAddForm(true)}
              variant="outline"
              className="border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs"
            >
              Add Payment Method
            </Button>
          </div>
        )}
      </div>

      {/* Security note */}
      <div className="flex gap-2 items-center bg-slate-50 border border-slate-200 p-4 mt-8 rounded-none">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <p className="text-xs text-slate-550 leading-normal">
          <strong>Safe & Secure Payments:</strong> We utilize advanced encryption standards to mask and safeguard your account details. Your credentials are never stored in plain text.
        </p>
      </div>
    </div>
  );
};

export default PaymentMethodsPage;
