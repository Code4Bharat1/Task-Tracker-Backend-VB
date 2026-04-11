import {
  createKtDocumentService,
  getKtDocumentsService,
  getKtDocumentByIdService,
  updateKtDocumentService,
  deleteKtDocumentService,
} from "./ktDocument.service.js";

export const createKtDocument = async (req, res, next) => {
  try {
    const { companyId, userId } = req;
    const doc = await createKtDocumentService({ companyId, userId, data: req.body, file: req.file });
    res.status(201).json({ document: doc });
  } catch (err) { next(err); }
};

export const getKtDocuments = async (req, res, next) => {
  try {
    const { companyId } = req;
    const { projectId, moduleId, page, limit } = req.query;
    const result = await getKtDocumentsService({ companyId, projectId, moduleId, page, limit });
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const getKtDocumentById = async (req, res, next) => {
  try {
    const { companyId } = req;
    const doc = await getKtDocumentByIdService({ id: req.params.id, companyId });
    res.status(200).json({ document: doc });
  } catch (err) { next(err); }
};

export const updateKtDocument = async (req, res, next) => {
  try {
    const { companyId, userId } = req;
    const doc = await updateKtDocumentService({ id: req.params.id, companyId, userId, data: req.body, file: req.file });
    res.status(200).json({ document: doc });
  } catch (err) { next(err); }
};

export const deleteKtDocument = async (req, res, next) => {
  try {
    const { companyId } = req;
    await deleteKtDocumentService({ id: req.params.id, companyId });
    res.status(200).json({ message: "KT document deleted successfully" });
  } catch (err) { next(err); }
};
