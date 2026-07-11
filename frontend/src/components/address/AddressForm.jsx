import { useMemo } from 'react';

const defaultFields = [
  { key: 'fullName', label: 'Full Name', required: true, type: 'text' },
  { key: 'phone', label: 'Mobile Number', required: true, type: 'tel' },
  { key: 'district', label: 'District', required: true, type: 'text' },
  { key: 'thana', label: 'Upazila / Thana', required: true, type: 'text' },
  { key: 'area', label: 'Area / Village / Road', required: true, type: 'text' },
  { key: 'house', label: 'House / Flat (optional)', required: false, type: 'text' },
  { key: 'postalCode', label: 'Postal Code (optional)', required: false, type: 'text' },
  { key: 'deliveryInstructions', label: 'Delivery Instructions (optional)', required: false, type: 'textarea' },
];

export default function AddressForm({ form, onChange, showCountry = false, title = 'Shipping Address' }) {
  const fields = useMemo(() => {
    const base = [...defaultFields];
    if (showCountry) {
      base.push({ key: 'country', label: 'Country', required: true, type: 'text' });
    }
    return base;
  }, [showCountry]);

  const updateField = (key, value) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <div className="space-y-4">
      {title && <h2 className="font-semibold">{title}</h2>}
      {fields.map((field) => (
        <div key={field.key}>
          <label className="text-sm font-medium">{field.label}</label>
          {field.type === 'textarea' ? (
            <textarea
              value={form[field.key] || ''}
              onChange={(e) => updateField(field.key, e.target.value)}
              className="input-field mt-1 min-h-[90px]"
            />
          ) : (
            <input
              type={field.type}
              required={field.required}
              value={form[field.key] || ''}
              onChange={(e) => updateField(field.key, e.target.value)}
              className="input-field mt-1"
            />
          )}
        </div>
      ))}
    </div>
  );
}
