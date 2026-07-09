const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const uploadFileToS3 = async (file, ticketId) => {
    const key = `attachments/${ticketId}/${Date.now()}-${file.originalname}`;

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
    });

    await s3.send(command);
    return key; // store the key, not a public URL
};

const getAttachmentUrl = async (key, expiresInSeconds = 3600) => {
    if (!key) return null;

    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
    });

    return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
};

const uploadMetadataToS3 = async (ticket) => {
    const metadata = {
        ticketId: ticket.ticketId,
        status: ticket.status,
        description: ticket.description,
        createdAt: ticket.createdAt
    };

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `metadata/${ticket.ticketId}.json`,
        Body: JSON.stringify(metadata),
        ContentType: 'application/json'
    });

    await s3.send(command);
    console.log(`Metadata uploaded to S3 for ticket ${ticket.ticketId}`);
};

module.exports = { uploadFileToS3, uploadMetadataToS3, getAttachmentUrl };
