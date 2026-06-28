const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

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
    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
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

module.exports = { uploadFileToS3, uploadMetadataToS3 };