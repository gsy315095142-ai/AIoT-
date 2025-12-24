import { useState } from 'react';
import { useApp } from '../context/AppContext';

export const useSettingsLogic = () => {
    const { 
        currentUser, logout,
        regions, stores, deviceTypes, 
        addRegion, removeRegion, 
        addStore, removeStore, 
        addDeviceType, removeDeviceType 
    } = useApp();
  
    const [newRegion, setNewRegion] = useState('');
    const [newStoreName, setNewStoreName] = useState('');
    const [newStoreRegionId, setNewStoreRegionId] = useState('');
    const [newType, setNewType] = useState('');
  
    const handleAddRegion = () => {
      if (newRegion.trim()) {
        addRegion(newRegion);
        setNewRegion('');
      }
    };
  
    const handleAddStore = () => {
      if (newStoreName.trim() && newStoreRegionId) {
        addStore(newStoreName, newStoreRegionId);
        setNewStoreName('');
        setNewStoreRegionId('');
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
        newStoreName, setNewStoreName, newStoreRegionId, setNewStoreRegionId, handleAddStore, removeStore,
        newType, setNewType, handleAddType, removeDeviceType
    };
};