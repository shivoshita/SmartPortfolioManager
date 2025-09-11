import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, Plus } from "lucide-react";

interface DashboardWidget {
  id: string;
  title: string;
  component: React.ReactNode;
  width?: 'half' | 'full';
  height?: 'small' | 'medium' | 'large';
}

interface DashboardGridProps {
  widgets: DashboardWidget[];
  onReorder?: (widgets: DashboardWidget[]) => void;
  onAddWidget?: () => void;
}

export default function DashboardGrid({ widgets, onReorder, onAddWidget }: DashboardGridProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onReorder) return;

    const reorderedWidgets = Array.from(widgets);
    const [removed] = reorderedWidgets.splice(result.source.index, 1);
    reorderedWidgets.splice(result.destination.index, 0, removed);

    onReorder(reorderedWidgets);
    console.log('Widgets reordered:', reorderedWidgets.map(w => w.id));
  };

  const getWidgetClasses = (widget: DashboardWidget) => {
    let classes = "relative group ";
    
    // Width classes
    switch (widget.width) {
      case 'half':
        classes += "col-span-12 lg:col-span-6 ";
        break;
      case 'full':
      default:
        classes += "col-span-12 ";
        break;
    }
    
    // Height classes  
    switch (widget.height) {
      case 'small':
        classes += "row-span-1 ";
        break;
      case 'large':
        classes += "row-span-2 ";
        break;
      case 'medium':
      default:
        classes += "row-span-1 ";
        break;
    }
    
    return classes;
  };

  return (
    <div className="space-y-6">
      {/* Add Widget Button */}
      <div className="flex justify-end">
        <Button 
          onClick={onAddWidget} 
          className="flex items-center gap-2"
          data-testid="button-add-widget"
        >
          <Plus className="h-4 w-4" />
          Add Widget
        </Button>
      </div>

      {/* Draggable Grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard-grid">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`grid grid-cols-12 gap-6 auto-rows-max ${
                snapshot.isDraggingOver ? 'bg-muted/20 rounded-lg p-2' : ''
              }`}
            >
              {widgets.map((widget, index) => (
                <Draggable key={widget.id} draggableId={widget.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={getWidgetClasses(widget)}
                      data-testid={`widget-${widget.id}`}
                    >
                      <div className={`relative h-full ${
                        snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                      }`}>
                        {/* Drag Handle */}
                        <div 
                          {...provided.dragHandleProps}
                          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                        >
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-6 w-6 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                            data-testid={`drag-handle-${widget.id}`}
                          >
                            <GripVertical className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Widget Content */}
                        <div className="h-full">
                          {widget.component}
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              
              {/* Empty State */}
              {widgets.length === 0 && (
                <div className="col-span-12 flex items-center justify-center py-12">
                  <Card className="w-full max-w-md">
                    <CardContent className="p-6 text-center">
                      <div className="text-muted-foreground mb-4">
                        <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No widgets added yet
                      </div>
                      <Button onClick={onAddWidget} data-testid="button-add-first-widget">
                        Add Your First Widget
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}