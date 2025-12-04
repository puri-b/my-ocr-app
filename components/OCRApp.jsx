"use client";

import React, { useState } from "react";
import { Upload, FileText, Download, Loader2 } from "lucide-react";

export default function OCRApp() {
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState(
    "อ่านข้อความจากไฟล์นี้และสกัดข้อมูลทั้งหมดออกมา เป็นแต่ละ item โดยเรียงเป็น Column จากซ้ายไปขวา Column A = Customer Name ,Column B =Ship to,Column C = Address,Column D = Zone,Column E = Contact person,Column F = Customer Code,Column G = Doc Reference ,Column H =Invoice Dated,Column I = Order Booked by,Column J = PO,Column K = Item Code & Name,Column L = Batch no,Column M = Quantity,Column N = Bonus,Column O = % SP,Column P = Unit Price,Column Q = CT Total ,Column R =Total Value (Included CT),Column S = Total Before Tax ,Column T =Commercial Tax,Column U = Agency Discount,Column V = OverALL Discount ,Column W =Grand Total ,Column X =*Credit Note Amount,Column Y = Net Payable ,Column Z =Credit ,Column AA =Due on ,Column AB =Remarks ,Column AC =Invoice Ref แล้วได้ผลลัพธ์มาให้ทำ text to column แยก Column โดยยึดจาก |"
  );
  const [outputFormat, setOutputFormat] = useState("txt");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // โปรเจคทดลอง: ใส่ API key ตรงนี้ได้เลย
  const apiKey = "AIzaSyANgSVhGegoPlmv2Zudx2ZN5PYfJhk7nx0";

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];

    if (!validTypes.includes(selected.type)) {
      setError("รองรับเฉพาะ JPG, PNG, GIF, WEBP, PDF เท่านั้น");
      setFile(null);
      return;
    }

    setFile(selected);
    setError(null);
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("กรุณาเลือกไฟล์ก่อน");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const base64 = await fileToBase64(file);

      const requestBody = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: file.type,
                  data: base64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const text =
        data.candidates?.[0]?.content?.parts
          ?.map((p) => p.text || "")
          .join("") || "ไม่พบผลลัพธ์";

      setResult(text);
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;

    let text = result;
    let mime = "text/plain";

    if (outputFormat === "json") {
      try {
        text = JSON.stringify(JSON.parse(result), null, 2);
      } catch {
        text = JSON.stringify({ text: result }, null, 2);
      }
      mime = "application/json";
    }

    if (outputFormat === "csv") {
      const lines = result.split("\n");
      text = lines.map((l) => `"${l.replace(/"/g, '""')}"`).join("\n");
      mime = "text/csv";
    }

    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `result.${outputFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ocr-root">
      <div className="ocr-container">
        <div className="ocr-card">
          {/* Header */}
          <div className="ocr-header">
            <FileText style={{ width: 40, height: 40, color: "#4f46e5" }} />
            <h1 className="ocr-title">Document OCR AI System</h1>
          </div>

          {/* Upload */}
          <div style={{ marginBottom: 16 }}>
            <label className="ocr-label">เลือกไฟล์รูปภาพหรือ PDF</label>

            <input
              type="file"
              id="file-up"
              className="hidden-input"
              style={{ display: "none" }}
              accept="image/*,application/pdf"
              onChange={handleFileChange}
            />

            <label htmlFor="file-up" className="ocr-upload-area">
              <div>
                <Upload
                  style={{
                    width: 48,
                    height: 48,
                    color: "#9ca3af",
                    marginBottom: 8,
                  }}
                />
                <p className="ocr-upload-filename">
                  {file ? file.name : "คลิกเพื่อเลือกไฟล์"}
                </p>
                <p className="ocr-upload-hint">
                  รองรับไฟล์ JPG, PNG, GIF, WEBP, PDF
                </p>
              </div>
            </label>
          </div>
          
          {/* Output format */}
          <div style={{ marginBottom: 16 }}>
            <label className="ocr-label">รูปแบบไฟล์ผลลัพธ์</label>
            <div className="ocr-radio-group">
              {["txt", "csv", "json"].map((fmt) => (
                <label key={fmt}>
                  <input
                    type="radio"
                    value={fmt}
                    checked={outputFormat === fmt}
                    onChange={() => setOutputFormat(fmt)}
                    style={{ marginRight: 4 }}
                  />
                  .{fmt}
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            className="ocr-button-primary"
            onClick={handleSubmit}
            disabled={loading || !file}
          >
            {loading ? (
              <>
                <Loader2
                  style={{
                    width: 20,
                    height: 20,
                    animation: "spin 1s linear infinite",
                  }}
                />
                กำลังประมวลผล...
              </>
            ) : (
              "แปลงไฟล์ด้วย AI"
            )}
          </button>

          {/* Error */}
          {error && <div className="ocr-error">{error}</div>}

          {/* Result */}
          {result && (
            <>
              <div className="ocr-result-header">
                <h2 className="ocr-result-title">ผลลัพธ์</h2>
                <button
                  className="ocr-button-download"
                  onClick={downloadResult}
                >
                  <Download style={{ width: 16, height: 16 }} />
                  ดาวน์โหลด .{outputFormat}
                </button>
              </div>
              <div className="ocr-result-box">
                <pre>{result}</pre>
              </div>
            </>
          )}
        </div>

        <div className="ocr-footer">
          SIAMRAJATHANEE PUBLIC COMPANY
        </div>
      </div>
    </div>
  );
}
