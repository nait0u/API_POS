import React from 'react';
import { GenericUploadDialog } from '../common/GenericUploadDialog';
import { uploadPreciosNativo } from '../../services/apiClient';

export interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  empKey: number; 
  dynamicOptions: { value: string; label: string }[];
}

export const ImportDialog: React.FC<ImportDialogProps> = ({ isOpen, onClose, empKey, dynamicOptions }) => {
  return (
    <GenericUploadDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Importar Precios"
      formatOptions={dynamicOptions}
      onImport={async (file, format) => {
        return await uploadPreciosNativo(empKey, format, file);
      }}
    />
  );
};
