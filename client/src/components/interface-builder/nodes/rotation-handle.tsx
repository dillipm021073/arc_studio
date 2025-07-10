import { useState, useCallback, useEffect } from 'react';
import { RotateCw } from 'lucide-react';

interface RotationHandleProps {
  width: number;
  height: number;
  rotation: number;
  onRotate: (rotation: number) => void;
  visible: boolean;
  snapToAngles?: number[]; // e.g., [0, 45, 90, 135, 180, 225, 270, 315]
  snapThreshold?: number; // degrees within which to snap
}

export default function RotationHandle({
  width,
  height,
  rotation,
  onRotate,
  visible,
  snapToAngles = [0, 45, 90, 135, 180, 225, 270, 315],
  snapThreshold = 5,
}: RotationHandleProps) {
  const [isRotating, setIsRotating] = useState(false);
  const [startAngle, setStartAngle] = useState(0);
  const [startRotation, setStartRotation] = useState(0);
  const [center, setCenter] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get the center of the shape in screen coordinates
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + width / 2;
    const centerY = rect.top + height / 2;
    
    setCenter({ x: centerX, y: centerY });
    
    // Calculate initial angle
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    
    setIsRotating(true);
    setStartAngle(angle);
    setStartRotation(rotation);
  }, [width, height, rotation]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isRotating) return;

    // Calculate current angle
    const currentAngle = Math.atan2(e.clientY - center.y, e.clientX - center.x) * (180 / Math.PI);
    
    // Calculate rotation delta
    let deltaAngle = currentAngle - startAngle;
    
    // Normalize delta to -180 to 180
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;
    
    // Calculate new rotation
    let newRotation = startRotation + deltaAngle;
    
    // Normalize rotation to 0-360
    while (newRotation < 0) newRotation += 360;
    while (newRotation >= 360) newRotation -= 360;
    
    // Snap to angles if close enough
    for (const snapAngle of snapToAngles) {
      if (Math.abs(newRotation - snapAngle) <= snapThreshold) {
        newRotation = snapAngle;
        break;
      }
    }
    
    onRotate(newRotation);
  }, [isRotating, center, startAngle, startRotation, snapToAngles, snapThreshold, onRotate]);

  const handleMouseUp = useCallback(() => {
    setIsRotating(false);
  }, []);

  useEffect(() => {
    if (isRotating) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
      };
    }
  }, [isRotating, handleMouseMove, handleMouseUp]);

  if (!visible) return null;

  // Position the rotation handle above the shape
  const handleDistance = 30;
  const handleSize = 20;
  
  return (
    <div
      style={{
        position: 'absolute',
        top: `-${handleDistance + handleSize}px`,
        left: `${width / 2 - handleSize / 2}px`,
        width: `${handleSize}px`,
        height: `${handleSize}px`,
        background: '#3b82f6',
        border: '2px solid #ffffff',
        borderRadius: '50%',
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 11,
      }}
      onMouseDown={handleMouseDown}
    >
      <RotateCw size={12} color="#ffffff" />
    </div>
  );
}