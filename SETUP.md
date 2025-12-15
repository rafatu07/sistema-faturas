# Guia de Configuração - Sistema de Faturas

## Passo a Passo para Configuração Inicial

### 1. Configuração do Firebase

#### 1.1 Criar Projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Preencha o nome do projeto
4. Configure o Google Analytics (opcional)
5. Clique em "Criar projeto"

#### 1.2 Configurar Authentication

1. No menu lateral, vá em **Authentication**
2. Clique em **Começar**
3. Habilite o método **Email/Senha**
4. Salve as alterações

#### 1.3 Configurar Firestore

1. No menu lateral, vá em **Firestore Database**
2. Clique em **Criar banco de dados**
3. Escolha o modo de produção
4. Selecione a localização (ex: southamerica-east1 para Brasil)
5. Configure as regras de segurança (cole o conteúdo de `firestore.rules`)

#### 1.4 Configurar Storage

1. No menu lateral, vá em **Storage**
2. Clique em **Começar**
3. Aceite os termos
4. Configure as regras de segurança (cole o conteúdo de `storage.rules`)

#### 1.5 Obter Credenciais

1. No menu lateral, vá em **Configurações do projeto** (ícone de engrenagem)
2. Role até **Seus aplicativos**
3. Clique no ícone **Web** (`</>`)
4. Registre o app com um nome (ex: "Sistema de Faturas")
5. Copie as credenciais exibidas

### 2. Configurar Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 3. Criar Primeiro Usuário Admin

#### Opção 1: Via Firebase Console

1. Vá em **Authentication** > **Users**
2. Clique em **Adicionar usuário**
3. Preencha email e senha
4. Anote o UID do usuário criado

5. Vá em **Firestore Database** > **Data**
6. Clique em **Iniciar coleção**
7. Nome da coleção: `users`
8. Document ID: use o UID do usuário
9. Adicione os campos:
   - `name` (string): Nome do usuário
   - `email` (string): Email do usuário
   - `role` (string): `admin`
   - `createdAt` (timestamp): data atual
   - `updatedAt` (timestamp): data atual

#### Opção 2: Via Código (Temporário)

Você pode criar um script temporário para criar o primeiro admin:

```typescript
// scripts/create-admin.ts (temporário, depois deletar)
import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  // Suas credenciais aqui
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
  const email = 'admin@exemplo.com';
  const password = 'senhaSegura123';
  const name = 'Administrador';

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name,
      email,
      role: 'admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    console.log('Admin criado com sucesso!');
  } catch (error) {
    console.error('Erro ao criar admin:', error);
  }
}

createAdmin();
```

### 4. Configurar Índices do Firestore

Alguns índices compostos podem ser necessários. O Firebase solicitará automaticamente quando necessário, mas você pode criar antecipadamente:

1. Vá em **Firestore Database** > **Índices**
2. Clique em **Criar índice**
3. Crie os seguintes índices:

**Índice 1:**
- Collection: `empenhos`
- Campos:
  - `userId` (Ascending)
  - `status` (Ascending)
  - `createdAt` (Descending)

**Índice 2:**
- Collection: `empenhos`
- Campos:
  - `userId` (Ascending)
  - `contaBancaria` (Ascending)
  - `createdAt` (Descending)

**Índice 3:**
- Collection: `faturas`
- Campos:
  - `userId` (Ascending)
  - `tipo` (Ascending)
  - `vencimento` (Ascending)

**Índice 4:**
- Collection: `faturaEmpenhos`
- Campos:
  - `faturaId` (Ascending)
  - `createdAt` (Descending)

### 5. Testar o Sistema

1. Execute `npm run dev`
2. Acesse `http://localhost:3000`
3. Faça login com o usuário admin criado
4. Teste as funcionalidades:
   - Criar um empenho
   - Criar uma fatura (com e sem OCR)
   - Vincular empenho a fatura
   - Visualizar relatórios

### 6. Deploy (Opcional)

#### Vercel (Recomendado)

1. Instale a CLI: `npm i -g vercel`
2. Execute: `vercel`
3. Configure as variáveis de ambiente na dashboard da Vercel
4. Deploy automático a cada push

#### Outras Plataformas

O sistema pode ser deployado em qualquer plataforma que suporte Next.js:
- Netlify
- AWS Amplify
- Google Cloud Run
- Azure Static Web Apps

## Troubleshooting

### Erro: "Firebase: Error (auth/user-not-found)"
- Verifique se o usuário foi criado no Firebase Authentication

### Erro: "Missing or insufficient permissions"
- Verifique se as Security Rules do Firestore estão corretas
- Verifique se o usuário tem o campo `role` no documento `users`

### OCR não funciona
- Verifique se o navegador suporta WebAssembly (necessário para Tesseract.js)
- Tente usar uma imagem de melhor qualidade
- O OCR funciona melhor com imagens em alta resolução

### Upload de arquivo falha
- Verifique as Security Rules do Storage
- Verifique o tamanho do arquivo (máx. 10MB)
- Verifique se o formato é suportado (imagem ou PDF)

## Suporte

Para mais ajuda, consulte a documentação do Firebase e Next.js.

