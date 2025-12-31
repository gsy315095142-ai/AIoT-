import { useState } from 'react';
import { useApp } from '../context/AppContext';

export const useSettingsLogic = () => {
    const { 
        currentUser, logout,
        regions, stores, deviceTypes, suppliers,
        addRegion, updateRegion, removeRegion, 
        addDeviceType, removeDeviceType,
        addSupplier, updateSupplier, removeSupplier
    } = useApp();
  
    const [newRegion, setNewRegion] = useState('');
    const [newType, setNewType] = useState('');
    const [newSupplier, setNewSupplier] = useState('');
  
    const handleAddRegion = () => {
      if (newRegion.trim()) {
        addRegion(newRegion);
        setNewRegion('');
      }
    };
  
    const handleAddType = () => {
      if (newType.trim()) {
        addDeviceType(newType);
        setNewType('');
      }
    };

    const handleAddSupplier = () => {
        if (newSupplier.trim()) {
            addSupplier(newSupplier);
            setNewSupplier('');
        }
    };

    return {
        currentUser, logout,
        regions, stores, deviceTypes, suppliers,
        newRegion, setNewRegion, handleAddRegion, updateRegion, removeRegion,
        newType, setNewType, handleAddType, removeDeviceType,
        newSupplier, setNewSupplier, handleAddSupplier, updateSupplier, removeSupplier
    };
};