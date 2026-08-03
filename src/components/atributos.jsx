import React from 'react';

export default function CampoAtributo({ nome, valor, modificador, onChange }) {
  return (
    <div className="campo-atributo-grupo">
      <label>{nome}</label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Input principal do atributo */}
        <input 
          type="number" 
          value={valor} 
          onChange={onChange} 
          style={{ width: '60px', textAlign: 'center' }}
        />
        
        {/* Input/Campo visual do modificador gerado */}
        <input 
          type="text" 
          value={modificador >= 0 ? `+${modificador}` : modificador} 
          readOnly 
          style={{ width: '50px', textAlign: 'center', backgroundColor: '#222', color: '#fff' }}
        />
      </div>
    </div>
  );
}