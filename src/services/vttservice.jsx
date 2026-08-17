import { Client, Databases, Storage, ID, Query } from 'appwrite';

const client = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('6a7e40de002c4df49de1'); 

const databases = new Databases(client);
const storage = new Storage(client);

const DATABASE_ID = '6a7e41b20037ce22279c'; 
const BUCKET_ID = '6a7f988f0019a7c08620';  

const COLLECTIONS = {
  SALAS: 'salas',
  MAPAS: 'mapas',
  TOKENS: 'tokens',
  FOLHETOS: 'folhetos'
};

const extrairFileIdDaUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/files\/([a-zA-Z0-9._-]+)(?:[\/?]|$)/);
  return match ? match[1] : null;
};

export const uploadArquivoStorage = async (file) => {
  const upload = await storage.createFile(BUCKET_ID, ID.unique(), file);
  const fileUrlObj = storage.getFileView(BUCKET_ID, upload.$id);
  const fileUrlString = typeof fileUrlObj === 'string' ? fileUrlObj : fileUrlObj.href;

  return {
    fileId: upload.$id,
    url: fileUrlString
  };
};

export const salvarRecursoNoBanco = async (colecaoNome, dados) => {
  const collectionId = COLLECTIONS[colecaoNome.toUpperCase()] || colecaoNome;

  if (!collectionId) {
    throw new Error(`Collection ID não encontrado para: ${colecaoNome}`);
  }

  return await databases.createDocument(
    DATABASE_ID,
    collectionId,
    ID.unique(),
    dados
  );
};

export const atualizarEstadoDaSala = async (documentId, dados) => {
  return await databases.updateDocument(
    DATABASE_ID,
    COLLECTIONS.SALAS,
    documentId,
    dados
  );
};

export const deletarSalaDoBanco = async (documentId) => {
  return await databases.deleteDocument(
    DATABASE_ID,
    COLLECTIONS.SALAS,
    documentId
  );
};

export const carregarDadosDaSala = async (codigo) => {
  const res = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.SALAS,
    [Query.equal('codigo', codigo)]
  );
  return res.documents[0] || null;
};

export const criarSalaNoAppwrite = async (codigo, mestreId) => {
  return await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.SALAS,
    ID.unique(),
    {
      codigo: codigo,
      mestre_id: mestreId,
      recursos_mapas: [],
      recursos_tokens: [],
      recursos_folhetos: []
    }
  );
};

export const limparRecursosDaSala = async (codigoSala, salaDoc = null) => {
  const colecoesRecursos = [COLLECTIONS.MAPAS, COLLECTIONS.TOKENS, COLLECTIONS.FOLHETOS];
  const fileIdsParaDeletar = new Set();

  // Limpa os documentos das coleções e extrai os file_ids
  for (const collectionId of colecoesRecursos) {
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        collectionId,
        [Query.equal('sala_id', codigoSala)]
      );

      for (const doc of res.documents) {
        const urlItem = doc.imagem_url || doc.url || doc.mapa_url;
        const fileId = doc.file_id || doc.fileId || extrairFileIdDaUrl(urlItem);

        if (fileId && typeof fileId === 'string') {
          fileIdsParaDeletar.add(fileId);
        }

        await databases.deleteDocument(DATABASE_ID, collectionId, doc.$id);
      }
    } catch (err) {
      console.error(`Erro ao limpar documentos da coleção ${collectionId}:`, err);
    }
  }

  // Extrai IDs a partir dos arrays de URLs armazenados no documento da Sala
  if (salaDoc) {
    const todosUrls = [
      ...(salaDoc.recursos_mapas || []),
      ...(salaDoc.recursos_tokens || []),
      ...(salaDoc.recursos_folhetos || []),
      salaDoc.mapa_url
    ];

    todosUrls.forEach(url => {
      const fileId = extrairFileIdDaUrl(url);
      if (fileId && typeof fileId === 'string') {
        fileIdsParaDeletar.add(fileId);
      }
    });
  }

  // Deleta do Bucket
  for (const fileId of fileIdsParaDeletar) {
    try {
      await storage.deleteFile(BUCKET_ID, fileId);
      console.log(`Arquivo removido com sucesso: ${fileId}`);
    } catch (errStorage) {
      if (errStorage?.code !== 404) {
        console.warn(`Erro ao excluir arquivo ${fileId} do Storage:`, errStorage);
      }
    }
  }
};
