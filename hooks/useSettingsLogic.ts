import { useState } from 'react';
import { useApp } from '../context/AppContext';

export const useSettingsLogic = () => {
    const { 
        currentUser, logout,
        regions, stores, deviceTypes, 
        addRegion, removeRegion, 
        addDeviceType, removeDeviceType 
    } = useApp();
  
    const [newRegion, setNewRegion] = useState('');
    const [newType, setNewType] = useState('');
  
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

    return {
        currentUser, logout,
        regions, stores, deviceTypes,
        newRegion, setNewRegion, handleAddRegion, removeRegion,
        newType, setNewType, handleAddType, removeDeviceType
    };
};