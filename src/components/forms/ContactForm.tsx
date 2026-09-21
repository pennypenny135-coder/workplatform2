import { useState } from 'react';
import { useApp } from '../../app/AppContext';
import { Input, Textarea, Select } from '../ui/Input';
import { Button } from '../ui/Button';
import type { Contact, ContactStatus } from '../../types';

interface ContactFormProps {
  contact?: Contact;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ContactForm({ contact, onSuccess, onCancel }: ContactFormProps) {
  const { addContact, updateContact } = useApp();

  const [name, setName] = useState(contact?.name ?? '');
  const [company, setCompany] = useState(contact?.company ?? '');
  const [phone, setPhone] = useState(contact?.phone ?? '');
  const [email, setEmail] = useState(contact?.email ?? '');
  const [status, setStatus] = useState<ContactStatus>(contact?.status ?? 'lead');
  const [lastContactDate, setLastContactDate] = useState(contact?.lastContactDate ?? '');
  const [nextFollowUpDate, setNextFollowUpDate] = useState(contact?.nextFollowUpDate ?? '');
  const [notes, setNotes] = useState(contact?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = '請輸入聯絡人名稱';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const contactData = {
      name: name.trim(),
      company: company || undefined,
      phone: phone || undefined,
      email: email || undefined,
      status,
      lastContactDate: lastContactDate || undefined,
      nextFollowUpDate: nextFollowUpDate || undefined,
      notes,
    };

    if (contact) {
      updateContact({ ...contact, ...contactData });
    } else {
      addContact(contactData);
    }
    onSuccess();
  };

  return (
    <div className="space-y-4">
      <Input
        label="姓名 *"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="請輸入姓名"
        error={errors.name}
        autoFocus
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="公司" value={company} onChange={e => setCompany(e.target.value)} placeholder="公司（選填）" />
        <Input label="電話" value={phone} onChange={e => setPhone(e.target.value)} placeholder="電話（選填）" type="tel" />
      </div>
      <Input label="電郵" value={email} onChange={e => setEmail(e.target.value)} placeholder="電郵（選填）" type="email" />
      <Select
        label="狀態"
        value={status}
        onChange={e => setStatus(e.target.value as ContactStatus)}
        options={[
          { value: 'lead', label: '潛在客戶' },
          { value: 'contacted', label: '已聯絡' },
          { value: 'proposal', label: '報價中' },
          { value: 'won', label: '成交' },
          { value: 'lost', label: '失敗' },
        ]}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="最後聯絡日期"
          type="date"
          value={lastContactDate}
          onChange={e => setLastContactDate(e.target.value)}
        />
        <Input
          label="下次跟進日期"
          type="date"
          value={nextFollowUpDate}
          onChange={e => setNextFollowUpDate(e.target.value)}
        />
      </div>
      <Textarea
        label="備註"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="備註（選填）"
        rows={2}
      />
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">取消</Button>
        <Button onClick={handleSubmit} className="flex-1">{contact ? '儲存' : '新增'}</Button>
      </div>
    </div>
  );
}
