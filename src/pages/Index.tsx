import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

interface Conclusion {
  id: string;
  number: string;
  date: string;
  objectName: string;
  customerId?: string;
  customerName?: string;
  weldNumber: string;
  welderId?: string;
  welderName?: string;
  pipeDiameterId?: string;
  pipeDiameter?: string;
  controlMethod: string;
  equipment?: string;
  normativeDoc?: string;
  executor?: string;
  certificate?: string;
  temperature?: string;
  defectDescription?: string;
  conclusion?: string;
  result: 'допущено' | 'не допущено';
  status: 'draft' | 'completed';
}

interface Template {
  id: string;
  name: string;
  controlMethod: string;
  fields: Record<string, string>;
}

interface Customer {
  id: string;
  name: string;
  inn?: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

interface Welder {
  id: string;
  fullName: string;
  certificateNumber: string;
  certificateDate?: string;
  qualification?: string;
  organization?: string;
}

interface PipeDiameter {
  id: string;
  diameter: string;
  wallThickness?: string;
  material?: string;
  gostStandard?: string;
}

const Index = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('list');
  const [conclusions, setConclusions] = useState<Conclusion[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [welders, setWelders] = useState<Welder[]>([]);
  const [pipeDiameters, setPipeDiameters] = useState<PipeDiameter[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [editingConclusion, setEditingConclusion] = useState<Conclusion | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    number: '',
    date: new Date().toISOString().split('T')[0],
    objectName: '',
    customerId: '',
    weldNumber: '',
    welderId: '',
    pipeDiameterId: '',
    controlMethod: '',
    equipment: '',
    normativeDoc: 'СТО Газпром 15-1.3-004-2023',
    executor: '',
    certificate: '',
    temperature: '',
    defectDescription: '',
    conclusion: '',
    result: 'допущено' as 'допущено' | 'не допущено'
  });

  const [newCustomer, setNewCustomer] = useState({ name: '', inn: '', address: '', contactPerson: '', phone: '', email: '' });
  const [newWelder, setNewWelder] = useState({ fullName: '', certificateNumber: '', certificateDate: '', qualification: '', organization: '' });
  const [newPipeDiameter, setNewPipeDiameter] = useState({ diameter: '', wallThickness: '', material: '', gostStandard: '' });
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddWelder, setShowAddWelder] = useState(false);
  const [showAddPipeDiameter, setShowAddPipeDiameter] = useState(false);
  const [showNumbersDialog, setShowNumbersDialog] = useState(false);
  const [numberPrefix, setNumberPrefix] = useState('НК');
  const [currentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
    generateNextNumber();
  }, []);

  const generateNextNumber = () => {
    if (conclusions.length === 0) {
      setFormData(prev => ({ ...prev, number: `${numberPrefix}-${currentYear}-001` }));
      return;
    }
    
    const currentYearConclusions = conclusions.filter(c => 
      c.number.includes(`-${currentYear}-`)
    );
    
    if (currentYearConclusions.length === 0) {
      setFormData(prev => ({ ...prev, number: `${numberPrefix}-${currentYear}-001` }));
      return;
    }
    
    const numbers = currentYearConclusions.map(c => {
      const match = c.number.match(/-\d{4}-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });
    
    const maxNumber = Math.max(...numbers);
    const nextNumber = String(maxNumber + 1).padStart(3, '0');
    setFormData(prev => ({ ...prev, number: `${numberPrefix}-${currentYear}-${nextNumber}` }));
  };

  const loadData = async () => {
    try {
      const [customersRes, weldersRes, pipesRes, templatesRes] = await Promise.all([
        fetch('/api/customers').catch(() => ({ ok: false })),
        fetch('/api/welders').catch(() => ({ ok: false })),
        fetch('/api/pipe-diameters').catch(() => ({ ok: false })),
        fetch('/api/templates').catch(() => ({ ok: false }))
      ]);

      if (customersRes.ok) setCustomers(await customersRes.json());
      if (weldersRes.ok) setWelders(await weldersRes.json());
      if (pipesRes.ok) setPipeDiameters(await pipesRes.json());
      if (templatesRes.ok) setTemplates(await templatesRes.json());
    } catch (error) {
      console.log('Загрузка данных из базы не удалась, используем локальные данные');
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        ...template.fields
      }));
      setSelectedTemplate(templateId);
      toast({
        title: 'Шаблон применён',
        description: `Данные из шаблона "${template.name}" загружены`
      });
    }
  };

  const handleAutofillFromPrevious = () => {
    if (conclusions.length > 0) {
      const lastConclusion = conclusions[0];
      setFormData(prev => ({
        ...prev,
        objectName: lastConclusion.objectName,
        customerId: lastConclusion.customerId || '',
        controlMethod: lastConclusion.controlMethod
      }));
      toast({
        title: 'Автозаполнение выполнено',
        description: 'Данные из последнего заключения загружены'
      });
    }
  };

  const handleSaveConclusion = () => {
    const customer = customers.find(c => c.id === formData.customerId);
    const welder = welders.find(w => w.id === formData.welderId);
    const pipe = pipeDiameters.find(p => p.id === formData.pipeDiameterId);

    const newConclusion: Conclusion = {
      id: editingConclusion?.id || Date.now().toString(),
      number: formData.number,
      date: formData.date,
      objectName: formData.objectName,
      customerId: formData.customerId,
      customerName: customer?.name,
      weldNumber: formData.weldNumber,
      welderId: formData.welderId,
      welderName: welder?.fullName,
      pipeDiameterId: formData.pipeDiameterId,
      pipeDiameter: pipe?.diameter,
      controlMethod: formData.controlMethod,
      equipment: formData.equipment,
      normativeDoc: formData.normativeDoc,
      executor: formData.executor,
      certificate: formData.certificate,
      temperature: formData.temperature,
      defectDescription: formData.defectDescription,
      conclusion: formData.conclusion,
      result: formData.result,
      status: 'completed'
    };

    if (editingConclusion) {
      setConclusions(conclusions.map(c => c.id === editingConclusion.id ? newConclusion : c));
      toast({ title: 'Заключение обновлено' });
      setIsEditDialogOpen(false);
    } else {
      setConclusions([newConclusion, ...conclusions]);
      toast({ title: 'Заключение сохранено', description: `Заключение ${newConclusion.number} создано` });
      setActiveTab('list');
    }
    
    resetForm();
    generateNextNumber();
  };

  const resetForm = () => {
    const currentNumber = formData.number;
    setFormData({
      number: currentNumber,
      date: new Date().toISOString().split('T')[0],
      objectName: '',
      customerId: '',
      weldNumber: '',
      welderId: '',
      pipeDiameterId: '',
      controlMethod: '',
      equipment: '',
      normativeDoc: 'СТО Газпром 15-1.3-004-2023',
      executor: '',
      certificate: '',
      temperature: '',
      defectDescription: '',
      conclusion: '',
      result: 'допущено'
    });
    setEditingConclusion(null);
  };

  const handleEditConclusion = (conclusion: Conclusion) => {
    setFormData({
      number: conclusion.number,
      date: conclusion.date,
      objectName: conclusion.objectName,
      customerId: conclusion.customerId || '',
      weldNumber: conclusion.weldNumber,
      welderId: conclusion.welderId || '',
      pipeDiameterId: conclusion.pipeDiameterId || '',
      controlMethod: conclusion.controlMethod,
      equipment: conclusion.equipment || '',
      normativeDoc: conclusion.normativeDoc || 'СТО Газпром 15-1.3-004-2023',
      executor: conclusion.executor || '',
      certificate: conclusion.certificate || '',
      temperature: conclusion.temperature || '',
      defectDescription: conclusion.defectDescription || '',
      conclusion: conclusion.conclusion || '',
      result: conclusion.result
    });
    setEditingConclusion(conclusion);
    setIsEditDialogOpen(true);
  };

  const filteredConclusions = conclusions.filter(c => {
    const matchesSearch = c.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.objectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.weldNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = filterMethod === 'all' || c.controlMethod === filterMethod;
    return matchesSearch && matchesMethod;
  });

  const exportToPDF = (conclusion: Conclusion) => {
    const doc = new jsPDF();
    
    doc.addFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf', 'Roboto', 'normal');
    
    doc.setFontSize(16);
    doc.text('ЗАКЛЮЧЕНИЕ', 105, 20, { align: 'center' });
    doc.text('по результатам неразрушающего контроля', 105, 28, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Номер: ${conclusion.number}`, 20, 45);
    doc.text(`Дата: ${new Date(conclusion.date).toLocaleDateString('ru-RU')}`, 20, 52);
    doc.text(`Объект: ${conclusion.objectName}`, 20, 59);
    
    if (conclusion.customerName) {
      doc.text(`Заказчик: ${conclusion.customerName}`, 20, 66);
    }
    
    doc.text(`Номер сварного стыка: ${conclusion.weldNumber}`, 20, 73);
    
    if (conclusion.welderName) {
      doc.text(`Сварщик: ${conclusion.welderName}`, 20, 80);
    }
    
    if (conclusion.pipeDiameter) {
      doc.text(`Диаметр трубы: ${conclusion.pipeDiameter}`, 20, 87);
    }
    
    doc.text(`Метод контроля: ${conclusion.controlMethod}`, 20, 94);
    
    if (conclusion.equipment) {
      doc.text(`Оборудование: ${conclusion.equipment}`, 20, 101);
    }
    
    if (conclusion.normativeDoc) {
      doc.text(`Нормативный документ: ${conclusion.normativeDoc}`, 20, 108);
    }
    
    if (conclusion.executor) {
      doc.text(`Исполнитель: ${conclusion.executor}`, 20, 115);
    }
    
    if (conclusion.certificate) {
      doc.text(`Номер аттестации: ${conclusion.certificate}`, 20, 122);
    }
    
    if (conclusion.temperature) {
      doc.text(`Температура: ${conclusion.temperature}°C`, 20, 129);
    }
    
    let yPos = 140;
    
    if (conclusion.defectDescription) {
      doc.text('Описание выявленных дефектов:', 20, yPos);
      yPos += 7;
      const splitDefects = doc.splitTextToSize(conclusion.defectDescription, 170);
      doc.text(splitDefects, 20, yPos);
      yPos += splitDefects.length * 5 + 5;
    }
    
    if (conclusion.conclusion) {
      doc.text('Заключение:', 20, yPos);
      yPos += 7;
      const splitConclusion = doc.splitTextToSize(conclusion.conclusion, 170);
      doc.text(splitConclusion, 20, yPos);
      yPos += splitConclusion.length * 5 + 5;
    }
    
    doc.setFontSize(12);
    doc.text(`Результат: ${conclusion.result.toUpperCase()}`, 20, yPos + 10);
    
    doc.save(`${conclusion.number}.pdf`);
    
    toast({
      title: 'PDF экспортирован',
      description: `Заключение ${conclusion.number} сохранено`
    });
  };

  const exportToWord = async (conclusion: Conclusion) => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: 'ЗАКЛЮЧЕНИЕ',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: 'по результатам неразрушающего контроля',
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Номер: ', bold: true }),
              new TextRun(conclusion.number)
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Дата: ', bold: true }),
              new TextRun(new Date(conclusion.date).toLocaleDateString('ru-RU'))
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Объект: ', bold: true }),
              new TextRun(conclusion.objectName)
            ]
          }),
          ...(conclusion.customerName ? [new Paragraph({
            children: [
              new TextRun({ text: 'Заказчик: ', bold: true }),
              new TextRun(conclusion.customerName)
            ]
          })] : []),
          new Paragraph({
            children: [
              new TextRun({ text: 'Номер сварного стыка: ', bold: true }),
              new TextRun(conclusion.weldNumber)
            ]
          }),
          ...(conclusion.welderName ? [new Paragraph({
            children: [
              new TextRun({ text: 'Сварщик: ', bold: true }),
              new TextRun(conclusion.welderName)
            ]
          })] : []),
          ...(conclusion.pipeDiameter ? [new Paragraph({
            children: [
              new TextRun({ text: 'Диаметр трубы: ', bold: true }),
              new TextRun(conclusion.pipeDiameter)
            ]
          })] : []),
          new Paragraph({
            children: [
              new TextRun({ text: 'Метод контроля: ', bold: true }),
              new TextRun(conclusion.controlMethod)
            ]
          }),
          ...(conclusion.equipment ? [new Paragraph({
            children: [
              new TextRun({ text: 'Оборудование: ', bold: true }),
              new TextRun(conclusion.equipment)
            ]
          })] : []),
          ...(conclusion.normativeDoc ? [new Paragraph({
            children: [
              new TextRun({ text: 'Нормативный документ: ', bold: true }),
              new TextRun(conclusion.normativeDoc)
            ]
          })] : []),
          ...(conclusion.executor ? [new Paragraph({
            children: [
              new TextRun({ text: 'Исполнитель: ', bold: true }),
              new TextRun(conclusion.executor)
            ]
          })] : []),
          ...(conclusion.certificate ? [new Paragraph({
            children: [
              new TextRun({ text: 'Номер аттестации: ', bold: true }),
              new TextRun(conclusion.certificate)
            ]
          })] : []),
          ...(conclusion.temperature ? [new Paragraph({
            children: [
              new TextRun({ text: 'Температура: ', bold: true }),
              new TextRun(`${conclusion.temperature}°C`)
            ]
          })] : []),
          new Paragraph({ text: '', spacing: { after: 200 } }),
          ...(conclusion.defectDescription ? [
            new Paragraph({
              text: 'Описание выявленных дефектов:',
              bold: true
            }),
            new Paragraph({ text: conclusion.defectDescription }),
            new Paragraph({ text: '', spacing: { after: 200 } })
          ] : []),
          ...(conclusion.conclusion ? [
            new Paragraph({
              text: 'Заключение:',
              bold: true
            }),
            new Paragraph({ text: conclusion.conclusion }),
            new Paragraph({ text: '', spacing: { after: 200 } })
          ] : []),
          new Paragraph({
            children: [
              new TextRun({ text: 'Результат: ', bold: true }),
              new TextRun({ text: conclusion.result.toUpperCase(), bold: true })
            ]
          })
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${conclusion.number}.docx`);
    
    toast({
      title: 'Word экспортирован',
      description: `Заключение ${conclusion.number} сохранено`
    });
  };

  const addCustomer = () => {
    const newCust: Customer = {
      id: Date.now().toString(),
      ...newCustomer
    };
    setCustomers([...customers, newCust]);
    setNewCustomer({ name: '', inn: '', address: '', contactPerson: '', phone: '', email: '' });
    setShowAddCustomer(false);
    toast({ title: 'Заказчик добавлен' });
  };

  const addWelder = () => {
    const newWeld: Welder = {
      id: Date.now().toString(),
      fullName: newWelder.fullName,
      certificateNumber: newWelder.certificateNumber,
      certificateDate: newWelder.certificateDate,
      qualification: newWelder.qualification,
      organization: newWelder.organization
    };
    setWelders([...welders, newWeld]);
    setNewWelder({ fullName: '', certificateNumber: '', certificateDate: '', qualification: '', organization: '' });
    setShowAddWelder(false);
    toast({ title: 'Сварщик добавлен' });
  };

  const addPipeDiameter = () => {
    const newPipe: PipeDiameter = {
      id: Date.now().toString(),
      ...newPipeDiameter
    };
    setPipeDiameters([...pipeDiameters, newPipe]);
    setNewPipeDiameter({ diameter: '', wallThickness: '', material: '', gostStandard: '' });
    setShowAddPipeDiameter(false);
    toast({ title: 'Диаметр добавлен' });
  };

  const renderConclusionForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="number">Номер заключения *</Label>
          <div className="flex gap-2">
            <Input
              id="number"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              placeholder="НК-2024-XXX"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={generateNextNumber}
              title="Сгенерировать следующий"
            >
              <Icon name="RefreshCw" size={16} />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Дата *</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="objectName">Наименование объекта *</Label>
          <Input
            id="objectName"
            value={formData.objectName}
            onChange={(e) => setFormData({ ...formData, objectName: e.target.value })}
            placeholder="МГ..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerId">Заказчик</Label>
          <Select value={formData.customerId} onValueChange={(value) => setFormData({ ...formData, customerId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите заказчика" />
            </SelectTrigger>
            <SelectContent>
              {customers.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="weldNumber">Номер стыка *</Label>
          <Input
            id="weldNumber"
            value={formData.weldNumber}
            onChange={(e) => setFormData({ ...formData, weldNumber: e.target.value })}
            placeholder="XX-XXX"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="welderId">Сварщик</Label>
          <Select value={formData.welderId} onValueChange={(value) => setFormData({ ...formData, welderId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите сварщика" />
            </SelectTrigger>
            <SelectContent>
              {welders.map(w => (
                <SelectItem key={w.id} value={w.id}>{w.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pipeDiameterId">Диаметр трубы</Label>
          <Select value={formData.pipeDiameterId} onValueChange={(value) => setFormData({ ...formData, pipeDiameterId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите диаметр" />
            </SelectTrigger>
            <SelectContent>
              {pipeDiameters.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.diameter}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="controlMethod">Метод контроля *</Label>
          <Select value={formData.controlMethod} onValueChange={(value) => setFormData({ ...formData, controlMethod: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите метод" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ультразвуковой контроль">Ультразвуковой контроль</SelectItem>
              <SelectItem value="Радиографический контроль">Радиографический контроль</SelectItem>
              <SelectItem value="Визуальный контроль">Визуальный контроль</SelectItem>
              <SelectItem value="Магнитопорошковый контроль">Магнитопорошковый контроль</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="equipment">Оборудование</Label>
          <Input
            id="equipment"
            value={formData.equipment}
            onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
            placeholder="Марка, модель"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="normativeDoc">Нормативный документ</Label>
        <Input
          id="normativeDoc"
          value={formData.normativeDoc}
          onChange={(e) => setFormData({ ...formData, normativeDoc: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="executor">Исполнитель</Label>
          <Input
            id="executor"
            value={formData.executor}
            onChange={(e) => setFormData({ ...formData, executor: e.target.value })}
            placeholder="ФИО"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="certificate">Номер аттестации</Label>
          <Input
            id="certificate"
            value={formData.certificate}
            onChange={(e) => setFormData({ ...formData, certificate: e.target.value })}
            placeholder="XXX-XX-XXXX"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="temperature">Температура, °C</Label>
          <Input
            id="temperature"
            value={formData.temperature}
            onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
            placeholder="+20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="defectDescription">Описание выявленных дефектов</Label>
        <Textarea
          id="defectDescription"
          value={formData.defectDescription}
          onChange={(e) => setFormData({ ...formData, defectDescription: e.target.value })}
          rows={4}
          placeholder="Подробное описание или 'Дефектов не выявлено'"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="conclusion">Заключение</Label>
        <Textarea
          id="conclusion"
          value={formData.conclusion}
          onChange={(e) => setFormData({ ...formData, conclusion: e.target.value })}
          rows={3}
          placeholder="Выводы по результатам контроля"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="result">Результат *</Label>
        <Select value={formData.result} onValueChange={(value: 'допущено' | 'не допущено') => setFormData({ ...formData, result: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="допущено">Допущено к эксплуатации</SelectItem>
            <SelectItem value="не допущено">Не допущено к эксплуатации</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-white border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="FileCheck" size={28} className="text-primary" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">НК Заключения</h1>
                <p className="text-sm text-muted-foreground">Система выдачи заключений по НК</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={showNumbersDialog} onOpenChange={setShowNumbersDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Icon name="Hash" size={16} className="mr-2" />
                    Номера
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Список номеров заключений</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="space-y-2 flex-1">
                        <Label>Префикс номера</Label>
                        <Input
                          value={numberPrefix}
                          onChange={(e) => setNumberPrefix(e.target.value.toUpperCase())}
                          placeholder="НК"
                          className="max-w-[150px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Следующий номер</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-base px-4 py-2">
                            {formData.number}
                          </Badge>
                          <Button size="sm" variant="ghost" onClick={generateNextNumber}>
                            <Icon name="RefreshCw" size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>№</TableHead>
                            <TableHead>Номер заключения</TableHead>
                            <TableHead>Дата</TableHead>
                            <TableHead>Объект</TableHead>
                            <TableHead>Статус</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {conclusions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                Заключений пока нет
                              </TableCell>
                            </TableRow>
                          ) : (
                            conclusions.map((c, index) => (
                              <TableRow key={c.id}>
                                <TableCell className="font-medium">{index + 1}</TableCell>
                                <TableCell className="font-mono">{c.number}</TableCell>
                                <TableCell>{new Date(c.date).toLocaleDateString('ru-RU')}</TableCell>
                                <TableCell>{c.objectName}</TableCell>
                                <TableCell>
                                  <Badge variant={c.result === 'допущено' ? 'default' : 'destructive'}>
                                    {c.result}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Badge variant="outline" className="text-xs font-normal">
                СТО Газпром 15-1.3-004-2023
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[700px]">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Icon name="List" size={16} />
              <span className="hidden sm:inline">Список</span>
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-2">
              <Icon name="FilePlus" size={16} />
              <span className="hidden sm:inline">Новое</span>
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Icon name="Database" size={16} />
              <span className="hidden sm:inline">База</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Icon name="LayoutTemplate" size={16} />
              <span className="hidden sm:inline">Шаблоны</span>
            </TabsTrigger>
            <TabsTrigger value="archive" className="flex items-center gap-2">
              <Icon name="Archive" size={16} />
              <span className="hidden sm:inline">Архив</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Все заключения</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    Найдено: {filteredConclusions.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Поиск по номеру, объекту, стыку..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterMethod} onValueChange={setFilterMethod}>
                    <SelectTrigger className="w-full sm:w-[250px]">
                      <SelectValue placeholder="Метод контроля" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все методы</SelectItem>
                      <SelectItem value="Ультразвуковой контроль">УЗК</SelectItem>
                      <SelectItem value="Радиографический контроль">РК</SelectItem>
                      <SelectItem value="Визуальный контроль">ВК</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  {filteredConclusions.map((conclusion) => (
                    <Card key={conclusion.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-foreground">{conclusion.number}</h3>
                              <Badge variant={conclusion.result === 'допущено' ? 'default' : 'destructive'}>
                                {conclusion.result}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Icon name="Calendar" size={14} />
                                {new Date(conclusion.date).toLocaleDateString('ru-RU')}
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Icon name="Building" size={14} />
                                {conclusion.objectName}
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Icon name="Workflow" size={14} />
                                {conclusion.weldNumber}
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Icon name="Activity" size={14} />
                                {conclusion.controlMethod}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditConclusion(conclusion)}
                            >
                              <Icon name="Edit" size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => exportToPDF(conclusion)}
                            >
                              <Icon name="FileDown" size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => exportToWord(conclusion)}
                            >
                              <Icon name="FileText" size={16} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="new" className="space-y-4 animate-fade-in">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Новое заключение</CardTitle>
                    <CardDescription className="mt-1">
                      Следующий номер: <span className="font-mono font-semibold text-foreground">{formData.number}</span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Icon name="LayoutTemplate" size={16} className="mr-2" />
                          Шаблон
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Выберите шаблон</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          {templates.map((template) => (
                            <Card
                              key={template.id}
                              className="cursor-pointer hover:bg-accent transition-colors"
                              onClick={() => handleTemplateSelect(template.id)}
                            >
                              <CardContent className="p-4">
                                <h4 className="font-medium">{template.name}</h4>
                                <p className="text-sm text-muted-foreground">{template.controlMethod}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={handleAutofillFromPrevious}>
                      <Icon name="Copy" size={16} className="mr-2" />
                      Из предыдущего
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {renderConclusionForm()}
                <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                  <Button variant="outline" onClick={() => setActiveTab('list')}>
                    Отмена
                  </Button>
                  <Button onClick={handleSaveConclusion} className="bg-primary hover:bg-primary/90">
                    <Icon name="Save" size={16} className="mr-2" />
                    Сохранить заключение
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Заказчики
                    <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <Icon name="Plus" size={16} />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Добавить заказчика</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Название *</Label>
                            <Input value={newCustomer.name} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <Label>ИНН</Label>
                            <Input value={newCustomer.inn} onChange={(e) => setNewCustomer({...newCustomer, inn: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <Label>Адрес</Label>
                            <Input value={newCustomer.address} onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <Label>Контактное лицо</Label>
                            <Input value={newCustomer.contactPerson} onChange={(e) => setNewCustomer({...newCustomer, contactPerson: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <Label>Телефон</Label>
                            <Input value={newCustomer.phone} onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={newCustomer.email} onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})} />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={addCustomer}>Добавить</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {customers.map(c => (
                      <div key={c.id} className="p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <p className="font-medium text-sm">{c.name}</p>
                        {c.inn && <p className="text-xs text-muted-foreground">ИНН: {c.inn}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Сварщики
                    <Dialog open={showAddWelder} onOpenChange={setShowAddWelder}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <Icon name="Plus" size={16} />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Добавить сварщика</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>ФИО *</Label>
                            <Input value={newWelder.fullName} onChange={(e) => setNewWelder({...newWelder, fullName: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <Label>Номер удостоверения *</Label>
                            <Input value={newWelder.certificateNumber} onChange={(e) => setNewWelder({...newWelder, certificateNumber: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <Label>Дата аттестации</Label>
                            <Input type="date" value={newWelder.certificateDate} onChange={(e) => setNewWelder({...newWelder, certificateDate: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <Label>Квалификация</Label>
                            <Input value={newWelder.qualification} onChange={(e) => setNewWelder({...newWelder, qualification: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <Label>Организация</Label>
                            <Input value={newWelder.organization} onChange={(e) => setNewWelder({...newWelder, organization: e.target.value})} />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={addWelder}>Добавить</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {welders.map(w => (
                      <div key={w.id} className="p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <p className="font-medium text-sm">{w.fullName}</p>
                        <p className="text-xs text-muted-foreground">Удостоверение: {w.certificateNumber}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Диаметры труб
                    <Dialog open={showAddPipeDiameter} onOpenChange={setShowAddPipeDiameter}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <Icon name="Plus" size={16} />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Добавить диаметр</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Диаметр *</Label>
                            <Input value={newPipeDiameter.diameter} onChange={(e) => setNewPipeDiameter({...newPipeDiameter, diameter: e.target.value})} placeholder="Ø1420" />
                          </div>
                          <div className="space-y-2">
                            <Label>Толщина стенки</Label>
                            <Input value={newPipeDiameter.wallThickness} onChange={(e) => setNewPipeDiameter({...newPipeDiameter, wallThickness: e.target.value})} placeholder="18.7 мм" />
                          </div>
                          <div className="space-y-2">
                            <Label>Материал</Label>
                            <Input value={newPipeDiameter.material} onChange={(e) => setNewPipeDiameter({...newPipeDiameter, material: e.target.value})} placeholder="Сталь 17Г1С" />
                          </div>
                          <div className="space-y-2">
                            <Label>ГОСТ</Label>
                            <Input value={newPipeDiameter.gostStandard} onChange={(e) => setNewPipeDiameter({...newPipeDiameter, gostStandard: e.target.value})} placeholder="ГОСТ 20295-85" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={addPipeDiameter}>Добавить</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {pipeDiameters.map(p => (
                      <div key={p.id} className="p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <p className="font-medium text-sm">{p.diameter}</p>
                        {p.wallThickness && <p className="text-xs text-muted-foreground">Толщина: {p.wallThickness}</p>}
                        {p.material && <p className="text-xs text-muted-foreground">{p.material}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Шаблоны заключений</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {templates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-foreground">{template.name}</h3>
                          <p className="text-sm text-muted-foreground">{template.controlMethod}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {Object.entries(template.fields).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            handleTemplateSelect(template.id);
                            setActiveTab('new');
                          }}
                        >
                          <Icon name="ArrowRight" size={16} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="archive" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Архив заключений</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Icon name="Archive" size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Архивные заключения будут отображаться здесь</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать заключение</DialogTitle>
          </DialogHeader>
          {renderConclusionForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>
              Отмена
            </Button>
            <Button onClick={handleSaveConclusion}>
              <Icon name="Save" size={16} className="mr-2" />
              Сохранить изменения
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;