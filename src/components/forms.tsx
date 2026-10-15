"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  login,
  saveItem,
  saveCategory,
  submitCount,
  submitAdjustment,
} from "@/lib/actions";
import { number, stockResult, todayJakarta } from "@/lib/domain";
import type { ActionResult, Category, Item } from "@/lib/types";
export function Submit({
  children = "Simpan",
  disabled = false,
}: {
  children?: React.ReactNode;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button className="btn" type="submit" disabled={disabled || pending}>
      {pending ? "Menyimpan…" : children}
    </button>
  );
}
export function Feedback({ state }: { state: ActionResult }) {
  return (
    <>
      {state.error && (
        <div className="notice error" role="alert">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="notice success" role="status">
          {state.success}
        </div>
      )}
    </>
  );
}
function Field({
  name,
  label,
  state,
  children,
  id,
}: {
  name: string;
  label: string;
  state: ActionResult;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id ?? name}>{label}</label>
      {children}
      {state.fields?.[name]?.map((e, i) => (
        <small className="field-error" role="alert" key={i}>
          {e}
        </small>
      ))}
    </div>
  );
}
export function LoginForm({ enabled }: { enabled: boolean }) {
  const [state, action] = useActionState(login, {});
  return (
    <form action={action} className="stack">
      <Feedback state={state} />
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="username"
          placeholder="nama@contoh.com"
          required
          disabled={!enabled}
        />
      </label>
      <label>
        Kata sandi
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Masukkan kata sandi"
          required
          disabled={!enabled}
        />
      </label>
      <Submit disabled={!enabled}>Masuk ke persediaan →</Submit>
      <p className="muted small">
        Hubungi pemilik atau pengelola untuk mendapatkan akun.
      </p>
    </form>
  );
}
export function ItemForm({
  item,
  categories,
}: {
  item?: Item;
  categories: Category[];
}) {
  const [state, action] = useActionState(saveItem, {});
  return (
    <form action={action} className="panel stack form-panel">
      <Feedback state={state} />
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <div className="form-grid">
        <Field name="name" label="Nama item" state={state}>
          <input
            id="name"
            name="name"
            defaultValue={item?.name}
            maxLength={120}
            required
          />
        </Field>
        <Field name="category_id" label="Kategori" state={state}>
          <select
            name="category_id"
            id="category_id"
            defaultValue={item?.category_id ?? ""}
            required
          >
            <option value="" disabled>
              Pilih kategori
            </option>
            {categories
              .filter((c) => c.active || c.id === item?.category_id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {!c.active ? " (tidak aktif)" : ""}
                </option>
              ))}
          </select>
          <Link className="small text-link" href="/settings">
            Kelola kategori
          </Link>
        </Field>
        <Field name="unit" label="Satuan" state={state}>
          <input
            name="unit"
            id="unit"
            list="units"
            defaultValue={item?.unit}
            maxLength={30}
            required
          />
          <datalist id="units">
            {[
              "kg",
              "gram",
              "liter",
              "ml",
              "pcs",
              "pack",
              "bottle",
              "box",
              "other",
            ].map((u) => (
              <option key={u}>{u}</option>
            ))}
          </datalist>
        </Field>
        <Field name="minimum_stock" label="Stok minimum" state={state}>
          <input
            type="number"
            inputMode="decimal"
            id="minimum_stock"
            name="minimum_stock"
            min="0"
            max="999999999"
            step="0.001"
            defaultValue={item?.minimum_stock ?? 0}
            required
          />
        </Field>
        {!item && (
          <Field name="initial_stock" label="Stok awal" state={state}>
            <input
              type="number"
              id="initial_stock"
              name="initial_stock"
              min="0"
              max="999999999"
              step="0.001"
              inputMode="decimal"
              defaultValue="0"
              required
            />
          </Field>
        )}
      </div>
      <Field name="notes" label="Catatan (opsional)" state={state}>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={1000}
          defaultValue={item?.notes}
        />
      </Field>
      <label className="check">
        <input
          type="checkbox"
          name="active"
          defaultChecked={item?.active ?? true}
        />{" "}
        Item aktif
      </label>
      {item && (
        <p className="muted small">
          Perubahan jumlah stok dicatat melalui hitung fisik atau penyesuaian.
          Menonaktifkan item tetap mempertahankan riwayatnya.
        </p>
      )}
      <div className="actions">
        <Submit />
        <Link
          className="btn secondary"
          href={item ? `/inventory/${item.id}` : "/inventory"}
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
export function CategoryForm({ category }: { category?: Category }) {
  const [state, action] = useActionState(saveCategory, {});
  return (
    <form action={action} className="panel stack">
      <input type="hidden" name="id" value={category?.id ?? ""} />
      <Feedback state={state} />
      <Field
        name="name"
        id={`category-${category?.id ?? "new"}`}
        label={category ? "Nama kategori" : "Kategori baru"}
        state={state}
      >
        <input
          name="name"
          id={`category-${category?.id ?? "new"}`}
          aria-label="Nama kategori"
          defaultValue={category?.name}
          maxLength={80}
          required
        />
      </Field>
      <label className="check">
        <input
          name="active"
          type="checkbox"
          defaultChecked={category?.active ?? true}
        />{" "}
        Aktif
      </label>
      <Submit>{category ? "Simpan kategori" : "Tambah kategori"}</Submit>
    </form>
  );
}
export function CountForm({ items }: { items: Item[] }) {
  const [state, action] = useActionState(submitCount, {});
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [review, setReview] = useState(false);
  const [search, setSearch] = useState("");
  const entries = items
    .filter((i) => values[i.id]?.trim())
    .map((i) => ({
      id: i.id,
      quantity: Number(values[i.id]),
      expected: i.current_stock,
      notes: notes[i.id] ?? "",
    }));
  const valid =
    entries.length > 0 &&
    entries.every(
      (e) =>
        Number.isFinite(e.quantity) &&
        e.quantity >= 0 &&
        e.quantity <= 999999999 &&
        Math.abs(e.quantity * 1000 - Math.round(e.quantity * 1000)) < 0.0001,
    );
  return (
    <form
      action={action}
      className="stack"
      onSubmit={(e) => {
        if (!review) {
          e.preventDefault();
          if (e.currentTarget.reportValidity() && valid) setReview(true);
        }
      }}
    >
      <Feedback state={state} />
      <input type="hidden" name="entries" value={JSON.stringify(entries)} />
      <div className="panel form-grid">
        <Field name="shift_date" label="Tanggal hitung" state={state}>
          <input
            id="shift_date"
            name="shift_date"
            type="date"
            defaultValue={todayJakarta()}
            required
            readOnly={review}
          />
        </Field>
        <Field name="shift_label" label="Nama shift" state={state}>
          <input
            id="shift_label"
            name="shift_label"
            placeholder="Contoh: Penutupan sore"
            maxLength={80}
            required
            readOnly={review}
          />
        </Field>
        <Field name="notes" label="Catatan umum (opsional)" state={state}>
          <input name="notes" id="notes" maxLength={1000} readOnly={review} />
        </Field>
      </div>
      {review ? (
        <div className="panel stack">
          <div>
            <span className="eyebrow">KONFIRMASI PENCATATAN</span>
            <h2>Periksa {entries.length} item sebelum menyimpan</h2>
            <p className="muted">
              Jumlah ini akan menjadi stok terbaru. Semua perubahan masuk ke
              riwayat.
            </p>
          </div>
          {entries.map((e) => {
            const i = items.find((i) => i.id === e.id)!;
            return (
              <div className="review-row" key={i.id}>
                <strong>{i.name}</strong>
                <span>
                  {number(i.current_stock)} →{" "}
                  <b>
                    {number(e.quantity)} {i.unit}
                  </b>
                </span>
              </div>
            );
          })}
          <button
            type="button"
            className="btn secondary"
            onClick={() => setReview(false)}
          >
            Kembali mengedit
          </button>
        </div>
      ) : (
        <>
          <div className="search-row">
            <input
              aria-label="Cari item untuk dihitung"
              placeholder="Cari nama item…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="muted small">
              {entries.length} dari {items.length} item diisi
            </span>
          </div>
          <div className="count-grid">
            {items
              .filter((i) =>
                i.name.toLowerCase().includes(search.toLowerCase()),
              )
              .map((i) => (
                <section className="panel count-card" key={i.id}>
                  <div className="item-heading">
                    <div>
                      <span className="eyebrow">
                        {i.category?.name ?? "Lainnya"}
                      </span>
                      <h3>{i.name}</h3>
                    </div>
                    <span className="unit">{i.unit}</span>
                  </div>
                  <p className="muted small">
                    Tercatat:{" "}
                    <b>
                      {number(i.current_stock)} {i.unit}
                    </b>
                  </p>
                  <label htmlFor={`qty-${i.id}`}>
                    Jumlah fisik
                    <input
                      id={`qty-${i.id}`}
                      className="quantity-input"
                      type="number"
                      min="0"
                      max="999999999"
                      step="0.001"
                      inputMode="decimal"
                      placeholder="Belum dihitung"
                      value={values[i.id] ?? ""}
                      onChange={(e) =>
                        setValues({ ...values, [i.id]: e.target.value })
                      }
                    />
                  </label>
                  {values[i.id] !== undefined && values[i.id] !== "" && (
                    <p className="small">
                      Selisih: {number(Number(values[i.id]) - i.current_stock)}{" "}
                      {i.unit}
                    </p>
                  )}
                  <input
                    aria-label={`Catatan ${i.name}`}
                    placeholder="Catatan item (opsional)"
                    maxLength={500}
                    value={notes[i.id] ?? ""}
                    onChange={(e) =>
                      setNotes({ ...notes, [i.id]: e.target.value })
                    }
                  />
                </section>
              ))}
          </div>
        </>
      )}
      <div className="sticky-save">
        <div>
          <strong>{entries.length} item dipilih</strong>
          <p className="small muted">Kosongkan item yang belum dihitung.</p>
        </div>
        <Submit disabled={!valid}>
          {review ? "Konfirmasi & simpan" : "Periksa pencatatan →"}
        </Submit>
      </div>
      {!valid && entries.length > 0 && (
        <p className="field-error" role="alert">
          Isi jumlah 0 atau lebih, maksimal 3 angka desimal.
        </p>
      )}
    </form>
  );
}
export function AdjustmentForm({ items }: { items: Item[] }) {
  const [state, action] = useActionState(submitAdjustment, {});
  const [id, setId] = useState(items[0]?.id ?? "");
  const [type, setType] = useState<"addition" | "reduction" | "correction">(
    "addition",
  );
  const [value, setValue] = useState("");
  const item = items.find((i) => i.id === id);
  let preview = "";
  let valid = false;
  if (item && value) {
    try {
      preview = `${number(item.current_stock)} → ${number(stockResult(item.current_stock, Number(value), type).next)} ${item.unit}`;
      valid = true;
    } catch {
      preview = "Jumlah tidak valid atau stok tidak mencukupi.";
    }
  }
  return (
    <form action={action} className="panel stack form-panel">
      <Feedback state={state} />
      <Field name="item_id" label="Item persediaan" state={state}>
        <select
          id="item_id"
          name="item_id"
          value={id}
          onChange={(e) => setId(e.target.value)}
          required
        >
          {items.map((i) => (
            <option value={i.id} key={i.id}>
              {i.name} ({number(i.current_stock)} {i.unit})
            </option>
          ))}
        </select>
      </Field>
      <input type="hidden" name="expected" value={item?.current_stock ?? ""} />
      <Field name="type" label="Jenis penyesuaian" state={state}>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
        >
          <option value="addition">Penambahan</option>
          <option value="reduction">Pengurangan</option>
          <option value="correction">Koreksi jumlah akhir</option>
        </select>
      </Field>
      <Field
        name="quantity"
        label={
          type === "correction"
            ? "Jumlah akhir yang benar"
            : "Jumlah penyesuaian"
        }
        state={state}
      >
        <input
          id="quantity"
          name="quantity"
          type="number"
          min="0.001"
          max="999999999"
          step="0.001"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
        />
      </Field>
      <p className="notice">
        {preview ||
          "Pilih item dan isi jumlah untuk melihat hasil penyesuaian."}
        {type === "correction" && (
          <span className="small">
            {" "}
            Untuk hasil nol, gunakan hitung fisik atau pengurangan.
          </span>
        )}
      </p>
      <Field name="reason" label="Alasan" state={state}>
        <input
          name="reason"
          id="reason"
          list="reasons"
          placeholder="Pilih atau tulis alasan"
          maxLength={200}
          required
        />
        <datalist id="reasons">
          {[
            "Stok diterima",
            "Barang rusak",
            "Terbuang",
            "Koreksi manual",
            "Lainnya",
          ].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </datalist>
      </Field>
      <Field name="notes" label="Catatan (opsional)" state={state}>
        <textarea name="notes" id="notes" maxLength={1000} rows={3} />
      </Field>
      <Submit disabled={!valid}>Simpan penyesuaian</Submit>
    </form>
  );
}
