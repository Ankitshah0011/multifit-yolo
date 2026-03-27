// Logo Scanner — YOLOv8 Object Detection (TensorFlow.js)
// Model files expected in: yolo-model/model.json + weight shards
const LogoScanner = (() => {

  let model = null;
  let modelLoadPromise = null;
  const MODEL_PATH = 'yolo-model/model.json';
  const INPUT_SIZE = 640; // YOLOv8 default input
  const CONFIDENCE_THRESHOLD = 0.60;
  const IOU_THRESHOLD = 0.45; // for NMS

  // ── Model Loading ──────────────────────────────────────

  function loadReferences() {
    if (modelLoadPromise) return modelLoadPromise;

    modelLoadPromise = tf.loadGraphModel(MODEL_PATH)
      .then((m) => {
        model = m;
        // Warm-up inference
        const warmup = tf.zeros([1, INPUT_SIZE, INPUT_SIZE, 3]);
        model.predict(warmup).dispose();
        warmup.dispose();
        console.log('LogoScanner: YOLOv8 model loaded & warmed up');
      })
      .catch((err) => {
        console.error('LogoScanner: model load failed', err.message || err);
        model = null;
      });

    return modelLoadPromise;
  }

  // ── Preprocessing ──────────────────────────────────────
  // YOLOv8 expects [1, 640, 640, 3] normalized to [0, 1]

  function preprocess(canvas) {
    return tf.tidy(() => {
      const img = tf.browser.fromPixels(canvas);
      const resized = tf.image.resizeBilinear(img, [INPUT_SIZE, INPUT_SIZE]);
      const normalized = resized.div(255.0);
      return normalized.expandDims(0); // [1, 640, 640, 3]
    });
  }

  // ── Post-processing ────────────────────────────────────
  // YOLOv8 TFJS output shape: [1, 5, 8400] (transposed)
  // Row 0-3: cx, cy, w, h (normalized to input size)
  // Row 4:   confidence for class 0 (multifit_logo)
  //
  // We extract detections above threshold and apply NMS.

  async function postprocess(output) {
    const data = await output.data();
    const shape = output.shape; // [1, 5, 8400] or [1, 8400, 5]

    let numDetections, numFields;

    // Handle both possible output shapes
    if (shape[1] === 5) {
      // [1, 5, 8400] — transposed format
      numFields = shape[1];
      numDetections = shape[2];
    } else {
      // [1, 8400, 5] — standard format
      numDetections = shape[1];
      numFields = shape[2];
    }

    const boxes = [];
    const scores = [];

    for (let i = 0; i < numDetections; i++) {
      let cx, cy, w, h, conf;

      if (shape[1] === 5) {
        // Transposed: data[field * numDetections + i]
        cx = data[0 * numDetections + i];
        cy = data[1 * numDetections + i];
        w  = data[2 * numDetections + i];
        h  = data[3 * numDetections + i];
        conf = data[4 * numDetections + i];
      } else {
        // Standard: data[i * numFields + field]
        cx = data[i * numFields + 0];
        cy = data[i * numFields + 1];
        w  = data[i * numFields + 2];
        h  = data[i * numFields + 3];
        conf = data[i * numFields + 4];
      }

      if (conf >= CONFIDENCE_THRESHOLD) {
        // Convert center format to corner format [y1, x1, y2, x2] for NMS
        const x1 = (cx - w / 2) / INPUT_SIZE;
        const y1 = (cy - h / 2) / INPUT_SIZE;
        const x2 = (cx + w / 2) / INPUT_SIZE;
        const y2 = (cy + h / 2) / INPUT_SIZE;

        boxes.push([y1, x1, y2, x2]);
        scores.push(conf);
      }
    }

    if (boxes.length === 0) {
      return { match: false, confidence: 0, detections: [] };
    }

    // Non-maximum suppression
    const boxesTensor = tf.tensor2d(boxes);
    const scoresTensor = tf.tensor1d(scores);
    const nmsResult = await tf.image.nonMaxSuppressionAsync(
      boxesTensor, scoresTensor, 10, IOU_THRESHOLD, CONFIDENCE_THRESHOLD
    );
    const nmsIndices = await nmsResult.data();

    boxesTensor.dispose();
    scoresTensor.dispose();
    nmsResult.dispose();

    const detections = [];
    for (const idx of nmsIndices) {
      detections.push({
        box: boxes[idx],
        confidence: scores[idx]
      });
    }

    const bestConf = detections.length > 0
      ? Math.max(...detections.map(d => d.confidence))
      : 0;

    return {
      match: bestConf >= CONFIDENCE_THRESHOLD,
      confidence: Math.round(bestConf * 100),
      detections
    };
  }

  // ── Analyze ────────────────────────────────────────────

  async function analyze(capturedCanvas) {
    await loadReferences();

    if (!model) {
      console.warn('LogoScanner: model not available');
      return { match: false, confidence: 0 };
    }

    let tensor;
    let output;
    try {
      tensor = preprocess(capturedCanvas);
      const rawOutput = model.predict(tensor);

      // Handle case where model returns object or single tensor
      output = rawOutput instanceof tf.Tensor ? rawOutput : Object.values(rawOutput)[0];

      console.log('LogoScanner: raw output shape', output.shape);

      const result = await postprocess(output);

      console.log('LogoScanner result:', {
        match: result.match,
        confidence: result.confidence + '%',
        detections: result.detections.length
      });

      return { match: result.match, confidence: result.confidence };
    } catch (err) {
      console.error('LogoScanner: analysis error', err);
      return { match: false, confidence: 0 };
    } finally {
      if (tensor) tensor.dispose();
      if (output) output.dispose();
    }
  }

  return { analyze, loadReferences };
})();
