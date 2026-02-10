export interface S3helperClient{
    add?: Function[],
    addRelativeTo?: [],
    clone?: [],
    use?: [],
    remove?: [],
    removeByTag?: [],
    concat?: [],
    applyToStack?: [],
    identify?: [],
    resolve?: [],
    config:S3helperClientconfig
	send: (object: any,err:object) => any,
}

export interface S3helperClientconfig{
    apiVersion: string,
    base64Decoder: Function,
    base64Encoder: Function,
    disableHostPrefix: boolean,
    endpointProvider: Function,
    logger: {},
    serviceId: string,
    signerConstructor?: Function,
    signingEscapePath: boolean,
    urlParser: Function,
    useArnRegion: any,
    utf8Decoder: Function,
    utf8Encoder: Function,
    region: Function,
    credentials: Function,
    runtime: string,
    defaultsMode: any,
    bodyLengthChecker: Function,
    credentialDefaultProvider: Function,
    defaultUserAgentProvider: Function,
    eventStreamSerdeProvider: Function,
    getAwsChunkedEncodingStream: Function,
    maxAttempts: Function,
    md5: Function,
    requestHandler:  {},
    retryMode: any,
    sdkStreamMixin: Function,
    sha1: Function,
    sha256: Function,
    streamCollector: Function,
    streamHasher: Function,
    useDualstackEndpoint: Function,
    useFipsEndpoint: Function,
    useAccelerateEndpoint: boolean,
    useGlobalEndpoint?: any,
    disableMultiregionAccessPoints: boolean,
    defaultSigningName: string,
    endpoint?: any,
    tls: boolean,
    isCustomEndpoint?: boolean | undefined,
    retryStrategy?: any,
    systemClockOffset: number,
    signer: any,
    forcePathStyle: any,
    customUserAgent?: any,
    eventStreamMarshaller: {}
}

export interface S3helperClientresponse{
    error: boolean,
    message: string,
    data: string,
    MessageId : string,
    Messages : object
  
}

export interface s3Parts {
    PartNumber: number,
    ETag: string
}