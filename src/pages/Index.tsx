import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Conclusion {
  id: string;
  number: string;
  date: string;
  objectName: string;
  weldNumber: string;
  controlMethod: string;
  result: 'допущено' | 'не допущено';
  status: 'draft' | 'completed';
}

interface Template {
  id: string;
  name: string;
  controlMethod: string;
  fields: Record<string, string>;
}

const Index = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('list');
  const [conclusions, setConclusions] = useState<Conclusion[]>([
    {
      id: '1',
      number: 'НК-2024-001',
      date: '2024-01-15',
      objectName: 'МГ "Сила Сибири"',
      weldNumber: 'СС-123',
      controlMethod: 'Ультразвуковой контроль',
      result: 'допущено',
      status: 'completed'
    },
    {
      id: '2',
      number: 'НК-2024-002',
      date: '2024-01-16',
      objectName: 'МГ "Северный поток"',
      weldNumber: 'СП-456',
      controlMethod: 'Радиографический контроль',
      result: 'не допущено',
      status: 'completed'
    }
  ]);

  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'УЗК магистральных трубопроводов',
      controlMethod: 'Ультразвуковой контроль',
      fields: {
        controlMethod: 'Ультразвуковой контроль',
        equipment: 'УД2-12',
        normativeDoc: 'СТО Газпром 15-1.3-004-2023'
      }
    },
    {
      id: '2',
      name: 'РК промысловых трубопроводов',
      controlMethod: 'Радиографический контроль',
      fields: {
        controlMethod: 'Радиографический контроль',
        equipment: 'РАП-150/300',
        normativeDoc: 'СТО Газпром 15-1.3-004-2023'
      }
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const [formData, setFormData] = useState({
    number: '',
    date: new Date().toISOString().split('T')[0],
    objectName: '',
    weldNumber: '',
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
        controlMethod: lastConclusion.controlMethod
      }));
      toast({
        title: 'Автозаполнение выполнено',
        description: 'Данные из последнего заключения загружены'
      });
    }
  };

  const handleSaveConclusion = () => {
    const newConclusion: Conclusion = {
      id: Date.now().toString(),
      number: formData.number,
      date: formData.date,
      objectName: formData.objectName,
      weldNumber: formData.weldNumber,
      controlMethod: formData.controlMethod,
      result: formData.result,
      status: 'completed'
    };

    setConclusions([newConclusion, ...conclusions]);
    
    setFormData({
      number: '',
      date: new Date().toISOString().split('T')[0],
      objectName: '',
      weldNumber: '',
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

    toast({
      title: 'Заключение сохранено',
      description: `Заключение ${newConclusion.number} успешно создано`
    });

    setActiveTab('list');
  };

  const filteredConclusions = conclusions.filter(c => {
    const matchesSearch = c.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.objectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.weldNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = filterMethod === 'all' || c.controlMethod === filterMethod;
    return matchesSearch && matchesMethod;
  });

  const handleExportPDF = (conclusion: Conclusion) => {
    toast({
      title: 'Экспорт в PDF',
      description: `Заключение ${conclusion.number} экспортировано`
    });
  };

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
            <Badge variant="outline" className="text-xs font-normal">
              СТО Газпром 15-1.3-004-2023
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Icon name="List" size={16} />
              <span className="hidden sm:inline">Список</span>
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-2">
              <Icon name="FilePlus" size={16} />
              <span className="hidden sm:inline">Новое</span>
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
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleExportPDF(conclusion)}
                            className="ml-4"
                          >
                            <Icon name="FileDown" size={16} />
                          </Button>
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
                  <CardTitle>Новое заключение</CardTitle>
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
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="number">Номер заключения *</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      placeholder="НК-2024-XXX"
                    />
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
                    <Label htmlFor="weldNumber">Номер сварного стыка *</Label>
                    <Input
                      id="weldNumber"
                      value={formData.weldNumber}
                      onChange={(e) => setFormData({ ...formData, weldNumber: e.target.value })}
                      placeholder="XX-XXX"
                    />
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

                <div className="flex justify-end gap-3 pt-4 border-t">
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
    </div>
  );
};

export default Index;
