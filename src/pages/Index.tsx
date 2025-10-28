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
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface DefectRecord {
  id: string;
  weldNumber: string;
  diameter: string;
  wallThickness: string;
  defectDescription: string;
  defectLocation: string;
  defectSize: string;
  result: 'ПРИГ' | 'БРАК';
}

interface Conclusion {
  id: string;
  number: string;
  date: string;
  
  labName: string;
  labAddress: string;
  labPhone: string;
  labAccreditation: string;
  
  objectName: string;
  objectAddress: string;
  
  customerName?: string;
  customerId?: string;
  
  pipelineSection: string;
  pipeDiameter?: string;
  wallThickness?: string;
  material?: string;
  gost: string;
  
  controlMethod: string;
  equipment?: string;
  sensitivity: string;
  normativeDoc?: string;
  
  executor?: string;
  certificate?: string;
  certificateDate?: string;
  
  defects: DefectRecord[];
  
  conclusionText?: string;
  result: 'допущено' | 'не допущено';
  status: 'draft' | 'completed';
}

interface Customer {
  id: string;
  name: string;
  inn?: string;
  address?: string;
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pipeDiameters, setPipeDiameters] = useState<PipeDiameter[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [editingConclusion, setEditingConclusion] = useState<Conclusion | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showNumbersDialog, setShowNumbersDialog] = useState(false);
  const [numberPrefix, setNumberPrefix] = useState('НК');
  const [currentYear] = useState(new Date().getFullYear());

  const [formData, setFormData] = useState({
    number: '',
    date: new Date().toISOString().split('T')[0],
    
    labName: 'НДТС',
    labAddress: '',
    labPhone: '',
    labAccreditation: '',
    
    objectName: '',
    objectAddress: '',
    
    customerId: '',
    
    pipelineSection: '',
    pipeDiameter: '',
    wallThickness: '',
    material: '',
    gost: 'ГОСТ 5520-79',
    
    controlMethod: 'Ультразвуковой контроль',
    equipment: '',
    sensitivity: '',
    normativeDoc: 'СТО Газпром 15-1.3-004-2023',
    
    executor: '',
    certificate: '',
    certificateDate: '',
    
    conclusionText: '',
    result: 'допущено' as 'допущено' | 'не допущено'
  });
  
  const [defects, setDefects] = useState<DefectRecord[]>([]);
  const [newDefect, setNewDefect] = useState({
    weldNumber: '',
    diameter: '',
    wallThickness: '',
    defectDescription: '',
    defectLocation: '',
    defectSize: '',
    result: 'ПРИГ' as 'ПРИГ' | 'БРАК'
  });

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', inn: '', address: '' });

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
      const [customersRes, pipesRes] = await Promise.all([
        fetch('/api/customers').catch(() => ({ ok: false })),
        fetch('/api/pipe-diameters').catch(() => ({ ok: false }))
      ]);

      if (customersRes.ok) setCustomers(await customersRes.json());
      if (pipesRes.ok) setPipeDiameters(await pipesRes.json());
    } catch (error) {
      console.log('Загрузка данных из базы не удалась');
    }
  };

  const handleSaveConclusion = () => {
    const customer = customers.find(c => c.id === formData.customerId);

    const newConclusion: Conclusion = {
      id: editingConclusion?.id || Date.now().toString(),
      number: formData.number,
      date: formData.date,
      
      labName: formData.labName,
      labAddress: formData.labAddress,
      labPhone: formData.labPhone,
      labAccreditation: formData.labAccreditation,
      
      objectName: formData.objectName,
      objectAddress: formData.objectAddress,
      
      customerId: formData.customerId,
      customerName: customer?.name,
      
      pipelineSection: formData.pipelineSection,
      pipeDiameter: formData.pipeDiameter,
      wallThickness: formData.wallThickness,
      material: formData.material,
      gost: formData.gost,
      
      controlMethod: formData.controlMethod,
      equipment: formData.equipment,
      sensitivity: formData.sensitivity,
      normativeDoc: formData.normativeDoc,
      
      executor: formData.executor,
      certificate: formData.certificate,
      certificateDate: formData.certificateDate,
      
      defects: defects,
      
      conclusionText: formData.conclusionText,
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
      labName: 'НДТС',
      labAddress: '',
      labPhone: '',
      labAccreditation: '',
      objectName: '',
      objectAddress: '',
      customerId: '',
      pipelineSection: '',
      pipeDiameter: '',
      wallThickness: '',
      material: '',
      gost: 'ГОСТ 5520-79',
      controlMethod: 'Ультразвуковой контроль',
      equipment: '',
      sensitivity: '',
      normativeDoc: 'СТО Газпром 15-1.3-004-2023',
      executor: '',
      certificate: '',
      certificateDate: '',
      conclusionText: '',
      result: 'допущено'
    });
    setDefects([]);
    setEditingConclusion(null);
  };

  const handleEditConclusion = (conclusion: Conclusion) => {
    setFormData({
      number: conclusion.number,
      date: conclusion.date,
      labName: conclusion.labName,
      labAddress: conclusion.labAddress,
      labPhone: conclusion.labPhone,
      labAccreditation: conclusion.labAccreditation,
      objectName: conclusion.objectName,
      objectAddress: conclusion.objectAddress,
      customerId: conclusion.customerId || '',
      pipelineSection: conclusion.pipelineSection,
      pipeDiameter: conclusion.pipeDiameter || '',
      wallThickness: conclusion.wallThickness || '',
      material: conclusion.material || '',
      gost: conclusion.gost,
      controlMethod: conclusion.controlMethod,
      equipment: conclusion.equipment || '',
      sensitivity: conclusion.sensitivity,
      normativeDoc: conclusion.normativeDoc || 'СТО Газпром 15-1.3-004-2023',
      executor: conclusion.executor || '',
      certificate: conclusion.certificate || '',
      certificateDate: conclusion.certificateDate || '',
      conclusionText: conclusion.conclusionText || '',
      result: conclusion.result
    });
    setDefects(conclusion.defects || []);
    setEditingConclusion(conclusion);
    setIsEditDialogOpen(true);
  };

  const filteredConclusions = conclusions.filter(c => {
    const matchesSearch = c.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.objectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = filterMethod === 'all' || c.controlMethod === filterMethod;
    return matchesSearch && matchesMethod;
  });

  const addDefect = () => {
    if (!newDefect.weldNumber) {
      toast({ title: 'Ошибка', description: 'Укажите номер стыка', variant: 'destructive' });
      return;
    }
    
    setDefects([...defects, { ...newDefect, id: Date.now().toString() }]);
    setNewDefect({
      weldNumber: '',
      diameter: formData.pipeDiameter,
      wallThickness: formData.wallThickness,
      defectDescription: '',
      defectLocation: '',
      defectSize: '',
      result: 'ПРИГ'
    });
    toast({ title: 'Дефект добавлен' });
  };

  const removeDefect = (id: string) => {
    setDefects(defects.filter(d => d.id !== id));
  };

  const addCustomer = () => {
    const newCust: Customer = {
      id: Date.now().toString(),
      ...newCustomer
    };
    setCustomers([...customers, newCust]);
    setNewCustomer({ name: '', inn: '', address: '' });
    setShowAddCustomer(false);
    toast({ title: 'Заказчик добавлен' });
  };

  const exportToPDF = (conclusion: Conclusion) => {
    const doc = new jsPDF();
    
    doc.setFontSize(14);
    doc.text('ЗАКЛЮЧЕНИЕ', 105, 20, { align: 'center' });
    doc.text(`№ ${conclusion.number}`, 105, 28, { align: 'center' });
    doc.text(`от ${new Date(conclusion.date).toLocaleDateString('ru-RU')}`, 105, 35, { align: 'center' });
    
    doc.setFontSize(10);
    let y = 50;
    
    doc.text(`Лаборатория: ${conclusion.labName}`, 20, y);
    y += 7;
    doc.text(`Объект: ${conclusion.objectName}`, 20, y);
    y += 7;
    doc.text(`Метод контроля: ${conclusion.controlMethod}`, 20, y);
    y += 15;
    
    if (conclusion.defects && conclusion.defects.length > 0) {
      const tableData = conclusion.defects.map((d, i) => [
        i + 1,
        d.weldNumber,
        d.diameter,
        d.defectDescription || 'Дефектов не обнаружено',
        d.defectLocation || '-',
        d.result
      ]);
      
      (doc as any).autoTable({
        startY: y,
        head: [['№', 'Стык', 'Диаметр', 'Описание дефекта', 'Местоположение', 'Результат']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [200, 200, 200], textColor: 0 },
        styles: { fontSize: 8, cellPadding: 3 }
      });
      
      y = (doc as any).lastAutoTable.finalY + 10;
    }
    
    doc.setFontSize(12);
    doc.text(`Заключение: ${conclusion.result.toUpperCase()}`, 20, y);
    
    doc.save(`${conclusion.number}.pdf`);
    
    toast({
      title: 'PDF экспортирован',
      description: `Заключение ${conclusion.number} сохранено`
    });
  };

  const renderConclusionForm = () => (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Данные лаборатории</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Наименование лаборатории</Label>
              <Input
                value={formData.labName}
                onChange={(e) => setFormData({ ...formData, labName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Адрес</Label>
              <Input
                value={formData.labAddress}
                onChange={(e) => setFormData({ ...formData, labAddress: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Телефон</Label>
              <Input
                value={formData.labPhone}
                onChange={(e) => setFormData({ ...formData, labPhone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Аттестат аккредитации</Label>
              <Input
                value={formData.labAccreditation}
                onChange={(e) => setFormData({ ...formData, labAccreditation: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Данные объекта</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Наименование объекта *</Label>
              <Input
                value={formData.objectName}
                onChange={(e) => setFormData({ ...formData, objectName: e.target.value })}
                placeholder="МГ..."
              />
            </div>
            <div className="space-y-2">
              <Label>Адрес объекта</Label>
              <Input
                value={formData.objectAddress}
                onChange={(e) => setFormData({ ...formData, objectAddress: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Заказчик</Label>
              <div className="flex gap-2">
                <Select value={formData.customerId} onValueChange={(value) => setFormData({ ...formData, customerId: value })}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Выберите заказчика" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="outline">
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
                    </div>
                    <DialogFooter>
                      <Button onClick={addCustomer}>Добавить</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Участок трубопровода</Label>
              <Input
                value={formData.pipelineSection}
                onChange={(e) => setFormData({ ...formData, pipelineSection: e.target.value })}
                placeholder="км 100 - км 120"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Параметры трубы и контроля</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Диаметр</Label>
              <Input
                value={formData.pipeDiameter}
                onChange={(e) => setFormData({ ...formData, pipeDiameter: e.target.value })}
                placeholder="Ø1420"
              />
            </div>
            <div className="space-y-2">
              <Label>Толщина стенки</Label>
              <Input
                value={formData.wallThickness}
                onChange={(e) => setFormData({ ...formData, wallThickness: e.target.value })}
                placeholder="18.7 мм"
              />
            </div>
            <div className="space-y-2">
              <Label>Материал</Label>
              <Input
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                placeholder="Сталь 17Г1С"
              />
            </div>
            <div className="space-y-2">
              <Label>ГОСТ</Label>
              <Input
                value={formData.gost}
                onChange={(e) => setFormData({ ...formData, gost: e.target.value })}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Метод контроля *</Label>
              <Select value={formData.controlMethod} onValueChange={(value) => setFormData({ ...formData, controlMethod: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ультразвуковой контроль">Ультразвуковой контроль (УЗК)</SelectItem>
                  <SelectItem value="Радиографический контроль">Радиографический контроль (РК)</SelectItem>
                  <SelectItem value="Визуальный контроль">Визуальный и измерительный контроль (ВИК)</SelectItem>
                  <SelectItem value="Магнитопорошковый контроль">Магнитопорошковый контроль (МПК)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Оборудование</Label>
              <Input
                value={formData.equipment}
                onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                placeholder="УД2-12"
              />
            </div>
            <div className="space-y-2">
              <Label>Чувствительность</Label>
              <Input
                value={formData.sensitivity}
                onChange={(e) => setFormData({ ...formData, sensitivity: e.target.value })}
                placeholder="2 мм"
              />
            </div>
            <div className="space-y-2">
              <Label>Нормативный документ</Label>
              <Input
                value={formData.normativeDoc}
                onChange={(e) => setFormData({ ...formData, normativeDoc: e.target.value })}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Исполнитель</Label>
              <Input
                value={formData.executor}
                onChange={(e) => setFormData({ ...formData, executor: e.target.value })}
                placeholder="ФИО"
              />
            </div>
            <div className="space-y-2">
              <Label>Удостоверение №</Label>
              <Input
                value={formData.certificate}
                onChange={(e) => setFormData({ ...formData, certificate: e.target.value })}
                placeholder="НАКС-01-2023-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Дата аттестации</Label>
              <Input
                type="date"
                value={formData.certificateDate}
                onChange={(e) => setFormData({ ...formData, certificateDate: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Результаты контроля</CardTitle>
            <Badge variant="secondary">{defects.length} записей</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4 space-y-4 bg-secondary/20">
            <h4 className="font-medium text-sm">Добавить запись о дефекте</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Номер стыка *</Label>
                <Input
                  value={newDefect.weldNumber}
                  onChange={(e) => setNewDefect({ ...newDefect, weldNumber: e.target.value })}
                  placeholder="250х150"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Диаметр</Label>
                <Input
                  value={newDefect.diameter}
                  onChange={(e) => setNewDefect({ ...newDefect, diameter: e.target.value })}
                  placeholder="720х8"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Толщина</Label>
                <Input
                  value={newDefect.wallThickness}
                  onChange={(e) => setNewDefect({ ...newDefect, wallThickness: e.target.value })}
                  placeholder="8 мм"
                  className="h-9"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs">Описание дефекта</Label>
                <Input
                  value={newDefect.defectDescription}
                  onChange={(e) => setNewDefect({ ...newDefect, defectDescription: e.target.value })}
                  placeholder="Дефектов не обнаружено"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Местоположение</Label>
                <Input
                  value={newDefect.defectLocation}
                  onChange={(e) => setNewDefect({ ...newDefect, defectLocation: e.target.value })}
                  placeholder="гладь"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Размер дефекта</Label>
                <Input
                  value={newDefect.defectSize}
                  onChange={(e) => setNewDefect({ ...newDefect, defectSize: e.target.value })}
                  placeholder="1.5 мм"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Результат</Label>
                <Select value={newDefect.result} onValueChange={(value: 'ПРИГ' | 'БРАК') => setNewDefect({ ...newDefect, result: value })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ПРИГ">ПРИГ</SelectItem>
                    <SelectItem value="БРАК">БРАК</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={addDefect} className="w-full h-9" size="sm">
                  <Icon name="Plus" size={14} className="mr-2" />
                  Добавить
                </Button>
              </div>
            </div>
          </div>
          
          {defects.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">№</TableHead>
                    <TableHead>Стык</TableHead>
                    <TableHead>Диаметр</TableHead>
                    <TableHead>Описание дефекта</TableHead>
                    <TableHead>Положение</TableHead>
                    <TableHead>Размер</TableHead>
                    <TableHead>Результат</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {defects.map((defect, index) => (
                    <TableRow key={defect.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{defect.weldNumber}</TableCell>
                      <TableCell>{defect.diameter}</TableCell>
                      <TableCell className="max-w-xs truncate">{defect.defectDescription}</TableCell>
                      <TableCell>{defect.defectLocation}</TableCell>
                      <TableCell>{defect.defectSize}</TableCell>
                      <TableCell>
                        <Badge variant={defect.result === 'ПРИГ' ? 'default' : 'destructive'}>
                          {defect.result}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeDefect(defect.id)}
                          className="h-8 w-8"
                        >
                          <Icon name="Trash2" size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Заключение</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Текст заключения</Label>
            <Textarea
              value={formData.conclusionText}
              onChange={(e) => setFormData({ ...formData, conclusionText: e.target.value })}
              rows={4}
              placeholder="По результатам контроля..."
            />
          </div>
          <div className="space-y-2">
            <Label>Итоговое решение *</Label>
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
        </CardContent>
      </Card>
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
          <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Icon name="List" size={16} />
              <span className="hidden sm:inline">Список</span>
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-2">
              <Icon name="FilePlus" size={16} />
              <span className="hidden sm:inline">Новое</span>
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
                      placeholder="Поиск по номеру, объекту..."
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
                      <SelectItem value="Визуальный контроль">ВИК</SelectItem>
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
                              {conclusion.defects && conclusion.defects.length > 0 && (
                                <Badge variant="outline">{conclusion.defects.length} стыков</Badge>
                              )}
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
                                <Icon name="Activity" size={14} />
                                {conclusion.controlMethod}
                              </div>
                              {conclusion.pipeDiameter && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Icon name="Circle" size={14} />
                                  {conclusion.pipeDiameter}
                                </div>
                              )}
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
              </CardHeader>
              <CardContent>
                {renderConclusionForm()}
                <div className="flex justify-end gap-3 pt-6 border-t mt-8">
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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
