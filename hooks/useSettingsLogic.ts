import { useState } from 'react';
import { useApp } from '../context/AppContext';

export const useSettingsLogic = () => {
    const { 
        currentUser, logout,
        regions, stores, deviceTypes, roomTypes,
        addRegion, removeRegion, 
        addDeviceType, removeDeviceType,
        addRoomType, removeRoomType
    } = useApp();
  
    const [newRegion, setNewRegion] = useState('');
    const [newType, setNewType] = useState('');
    const [newRoomType, setNewRoomType] = useState('');
  
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

    const handleAddRoomType = () => {
      if (newRoomType.trim()) {
        addRoomType(newRoomType);
        setNewRoomType('');
      }
    };

    return {
        currentUser, logout,
        regions, stores, deviceTypes, roomTypes,
        newRegion, setNewRegion, handleAddRegion, removeRegion,
        newType, setNewType, handleAddType, removeDeviceType,
        newRoomType, setNewRoomType, handleAddRoomType, removeRoomType
    };
};