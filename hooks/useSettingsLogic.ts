import { useState } from 'react';
import { useApp } from '../context/AppContext';

export const useSettingsLogic = () => {
    const { 
        currentUser, logout,
        regions, stores, deviceTypes, suppliers, assignableUsers,
        addRegion, updateRegion, removeRegion, 
        addDeviceType, removeDeviceType,
        addSupplier, updateSupplier, removeSupplier,
        addAssignableUser, removeAssignableUser
    } = useApp();
  
    // Existing States
    const [newRegion, setNewRegion] = useState('');
    const [newType, setNewType] = useState('');
    const [newSupplier, setNewSupplier] = useState('');

    // New User States
    const [newAssigneeName, setNewAssigneeName] = useState('');
    const [newAssigneeAccount, setNewAssigneeAccount] = useState('');
    const [newAssigneeRole, setNewAssigneeRole] = useState('');
  
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

    const handleAddAssignee = () => {
        if (newAssigneeName.trim() && newAssigneeAccount.trim() && newAssigneeRole.trim()) {
            addAssignableUser({
                name: newAssigneeName.trim(),
                account: newAssigneeAccount.trim(),
                role: newAssigneeRole.trim()
            });
            setNewAssigneeName('');
            setNewAssigneeAccount('');
            setNewAssigneeRole('');
        }
    };

    return {
        currentUser, logout,
        regions, stores, deviceTypes, suppliers, assignableUsers,
        newRegion, setNewRegion, handleAddRegion, updateRegion, removeRegion,
        newType, setNewType, handleAddType, removeDeviceType,
        newSupplier, setNewSupplier, handleAddSupplier, updateSupplier, removeSupplier,
        
        // Export New User State & Handlers
        newAssigneeName, setNewAssigneeName,
        newAssigneeAccount, setNewAssigneeAccount,
        newAssigneeRole, setNewAssigneeRole,
        handleAddAssignee, removeAssignableUser
    };
};