import { useState } from 'react';
import { useFormatMoney } from '../../store/useQuery';
import { query } from '../../data/db';
import { usePosStore } from './posStore';
import { CheckoutPanel } from './CheckoutPanel';
import type { Client } from '../../types';

export function POSCart() {
  const fc = useFormatMoney();
  const cart = usePosStore((s) => s.cart);
  const client = usePosStore((s) => s.client);
  const changeQty = usePosStore((s) => s.changeQty);
  const removeItem = usePosStore((s) => s.removeItem);
  const setClient = usePosStore((s) => s.setClient);
  const clearClient = usePosStore((s) => s.clearClient);

  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Client[]>([]);

  function onSearch(value: string) {
    setSearch(value);
    if (value.length < 2) {
      setResults([]);
      return;
    }
    setResults(
      query<Client>(`SELECT * FROM clients WHERE lower(fname||' '||lname) LIKE ? OR phone LIKE ? LIMIT 5`, [
        '%' + value.toLowerCase() + '%',
        '%' + value + '%',
      ]),
    );
  }

  function pick(c: Client) {
    setClient({ id: c.id, name: `${c.fname} ${c.lname}` });
    setResults([]);
    setSearch('');
  }

  return (
    <div className="pos-right">
      <div className="cart-header">🛒 Cart</div>

      <div className="cart-client">
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.9px', marginBottom: 5 }}>
          Client (optional)
        </div>
        {client ? (
          <div
            style={{
              background: 'var(--bg3)',
              borderRadius: 'var(--r)',
              padding: '6px 10px',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontWeight: 600 }}>{client.name}</span>
            <span style={{ cursor: 'pointer', color: 'var(--text3)' }} onClick={clearClient}>
              ✕
            </span>
          </div>
        ) : (
          <>
            <input
              placeholder="Search client…"
              value={search}
              style={{ fontSize: 12, padding: '7px 10px' }}
              onChange={(e) => onSearch(e.target.value)}
            />
            {results.length > 0 && (
              <div style={{ marginTop: 5 }}>
                {results.map((c) => (
                  <div className="member-pick" key={c.id} style={{ padding: '7px 10px', marginBottom: 4 }} onClick={() => pick(c)}>
                    <strong>
                      {c.fname} {c.lname}
                    </strong>{' '}
                    <span style={{ fontSize: 11, color: 'var(--text2)' }}>{c.phone || ''}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="cart-items">
        {cart.length ? (
          cart.map((item) => (
            <div className="cart-item" key={item.id}>
              <div className="ci-name">{item.name}</div>
              <div className="ci-qty">
                <button onClick={() => changeQty(item.id, -1)}>-</button>
                <span>{item.qty}</span>
                <button onClick={() => changeQty(item.id, 1)}>+</button>
              </div>
              <div className="ci-price">{fc(item.price * item.qty)}</div>
              <div className="ci-del" onClick={() => removeItem(item.id)}>
                ✕
              </div>
            </div>
          ))
        ) : (
          <div className="empty" style={{ padding: 20 }}>
            Cart is empty
          </div>
        )}
      </div>

      <CheckoutPanel />
    </div>
  );
}
