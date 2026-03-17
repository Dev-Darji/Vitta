import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';

const ImportStatement = () => {
  const [accounts, setAccounts] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const [accRes, clRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/clients')
      ]);
      setAccounts(accRes.data);
      setClients(clRes.data);
      if (accRes.data.length > 0) {
        setSelectedAccount(accRes.data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load accounts');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.pdf')) {
        toast.error('Only CSV and PDF files are supported');
        return;
      }
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    if (!selectedAccount) {
      toast.error('Please select a bank account');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(`/import/csv?account_id=${selectedAccount}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setUploadResult(response.data);
      toast.success(response.data.message);
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div data-testid="import-page" className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm"
      >
        <div className="mb-6">
          <h2 className="font-heading font-bold text-2xl text-primary mb-2">Import Bank Statement</h2>
          <p className="text-slate-600">Upload your CSV or PDF file to automatically import transactions</p>
        </div>

        <div className="space-y-6">
          {/* Account Selection */}
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2 block">Select Bank Account</Label>
            {accounts.length > 0 ? (
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger data-testid="account-select">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => {
                    const client = clients.find(c => c.id === account.client_id);
                    return (
                      <SelectItem key={account.id} value={account.id}>
                        {client ? <span className="font-bold text-primary mr-1">{client.name} —</span> : ''} {account.account_name} <span className="text-slate-400 text-[10px] ml-1">({account.bank_name})</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 mb-1">No bank accounts found</p>
                  <p className="text-sm text-yellow-700">Please add a bank account first from the Accounts page</p>
                </div>
              </div>
            )}
          </div>

          {/* File Upload */}
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2 block">Upload CSV or PDF File</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-primary transition-colors">
              <input
                data-testid="file-input"
                id="file-upload"
                type="file"
                accept=".csv,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  {file ? (
                    <FileText className="h-8 w-8 text-primary" />
                  ) : (
                    <Upload className="h-8 w-8 text-primary" />
                  )}
                </div>
                {file ? (
                  <div>
                    <p className="font-medium text-slate-900 mb-1">{file.name}</p>
                    <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-slate-900 mb-1">Click to upload or drag and drop</p>
                    <p className="text-sm text-slate-500">CSV or PDF files</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* File Format Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-sm text-blue-900 mb-2">Supported Formats</h4>
            <p className="text-sm text-blue-800 mb-2"><strong>CSV:</strong> Should have Date, Particulars, Debit, and Credit columns (Ledger and Account Holder Name supported)</p>
            <p className="text-sm text-blue-800"><strong>PDF:</strong> Text-based bank statement with transaction table (Date, Particulars, Amount)</p>
          </div>

          {/* Upload Button */}
          <Button
            data-testid="upload-button"
            onClick={handleUpload}
            disabled={!file || !selectedAccount || uploading}
            className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-lg font-semibold rounded-xl"
          >
            {uploading ? 'Uploading...' : 'Upload & Import'}
          </Button>

          {/* Upload Result */}
          {uploadResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3"
            >
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800 mb-1">Import Successful!</p>
                <p className="text-sm text-green-700">{uploadResult.message}</p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ImportStatement;